import {useState, useEffect, useCallback, useRef} from 'react';
import {
  initConnection,
  endConnection,
  getSubscriptions,
  requestSubscription,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  SubscriptionPurchase,
  PurchaseError,
} from 'react-native-iap';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const PRODUCT_ID = 'cleaner.premium.monthly.V1';

const API_BASE = 'https://cleaners-choice-server.vercel.app';
// const API_BASE = 'http://localhost:3000';

/** Returns true if the error represents a user cancellation (including simulator quirks) */
const isCancellation = (codeOrMessage: string | undefined): boolean => {
  if (!codeOrMessage) return false;
  const lower = codeOrMessage.toLowerCase();
  return (
    codeOrMessage === 'E_USER_CANCELLED' ||
    lower.includes('skerrordomain error 2') ||
    lower.includes('cancel')
  );
};

interface UseAppleIAPReturn {
  productPrice: string;
  iapLoading: boolean;
  initIAP: () => Promise<void>;
  purchaseWithApple: () => Promise<void>;
  iapError: string | null; 
}

export function useAppleIAP(
  onSuccess: () => void,
  onError: (msg: string) => void,
): UseAppleIAPReturn {
  const [productPrice, setProductPrice] = useState('$20.99');
  const [iapLoading, setIapLoading] = useState(false);
  const [iapError, setIapError] = useState<string | null>(null);
  const user = auth().currentUser;

  // Refs to avoid stale closures in listeners
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    let purchaseSub: any;
    let errorSub: any;

    const setup = async () => {
      try {
        // 1. Init IAP connection
        const connected = await initConnection();
        console.log('IAP connection:', connected);

        // 2. Fetch product from App Store
        const subs = await getSubscriptions({skus: [PRODUCT_ID]});
        console.log('Products returned:', subs.length);

        if (subs.length === 0) {
          // CRITICAL: Product not found
          const errorMsg = 
            'Product not available. Make sure:\n' +
            '1. Subscription is submitted in App Store Connect\n' +
            '2. Bundle ID matches\n' +
            '3. Wait 15-30 min after submission\n' +
            '4. Product ID is exactly: ' + PRODUCT_ID;
          
          console.error('error........... ' + errorMsg);
          setIapError(errorMsg);
          return;
        }

        // Product found — set price
        const product = subs[0];
        console.log('Product loaded:', product);
        console.log('Product loaded:', product.productId);
        const price = (product as any)?.localizedPrice ?? (product as any)?.displayPrice;
        console.log('Price:', price);
        setProductPrice(price || '$15.99');
        setIapError(null);

        // 3. Listen for purchase updates
        purchaseSub = purchaseUpdatedListener(
          async (purchase: SubscriptionPurchase) => {
            console.log('Purchase received:', purchase.productId);
            const receipt = purchase.transactionReceipt;
            
            if (!receipt) {
              console.error(' No receipt in purchase');
              return;
            }
            
            const currentUser = auth().currentUser;
            if (!currentUser?.uid) {
              console.error('User not authenticated');
              setIapLoading(false);
              onErrorRef.current('User not authenticated');
              return;
            }

            try {
              console.log('Validating receipt with backend...');
              
              // 4. Validate with backend
              const response = await fetch(`${API_BASE}/api/apple-validate`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({receipt, uid: currentUser.uid}),
              });

              const result = await response.json();
              console.log('Backend response:', result);

              if (!result.success) {

                throw new Error(result.error || 'Validation failed');
              }

              // 5. CRITICAL: Finish transaction
              console.log(' Receipt valid, finishing transaction...');
              await finishTransaction({purchase, isConsumable: false});
              console.log('Transaction finished');

              // 6. Update Firestore with Apple subscription info
              await firestore().collection('Users').doc(currentUser.uid).update({
                subscription: true,
                subscriptionProvider: 'apple',
                cancelSubscription: false,
                subscriptionId: purchase.transactionId || '',
                originalTransactionId: result.originalTransactionId || purchase.transactionId || '',
              });
              console.log('Firestore updated with Apple subscription');

              setIapLoading(false);
              onSuccessRef.current();
              
            } catch (err: any) {
              console.error('Purchase validation error:', err);
              setIapLoading(false);
              onErrorRef.current(err.message || 'Purchase validation failed');
            }
          },
        );

        // 4. Listen for purchase errors
        errorSub = purchaseErrorListener((error: PurchaseError) => {
          console.error('Purchase error:', error.code, error.message);
          setIapLoading(false);

          if (isCancellation(error.code) || isCancellation(error.message)) {
            console.log('User cancelled purchase (listener)');
          } else {
            onErrorRef.current(error.message || 'Purchase failed');
          }
        });

      } catch (err: any) {
        console.error(' IAP init error:', err);
        setIapError(err.message);
      }
    };

    setup();

    // Cleanup
    return () => {
      console.log('Cleaning up IAP listeners');
      purchaseSub?.remove();
      errorSub?.remove();
      endConnection();
    };
  }, []); // Empty deps — only run once on mount

  const purchaseWithApple = useCallback(async () => {
    if (iapError) {
      onError(iapError);
      return;
    }

    try {
      console.log('Starting purchase flow for:', PRODUCT_ID);
      setIapLoading(true);
      
      // This triggers StoreKit — result comes via purchaseUpdatedListener
      await requestSubscription({sku: PRODUCT_ID});
      
    } catch (err: any) {
      console.error('requestSubscription error:', err);
      setIapLoading(false);

      if (isCancellation(err.code) || isCancellation(err.message)) {
        console.log('User cancelled purchase (catch)');
      } else {
        onErrorRef.current(err.message || 'Purchase failed');
      }
    }
  }, [iapError]);

  const initIAP = useCallback(async () => {
    // Already initialized in useEffect
  }, []);

  return {productPrice, iapLoading, initIAP, purchaseWithApple, iapError};
}
