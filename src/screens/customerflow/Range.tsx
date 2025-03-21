import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Popable } from "react-native-popable";
import Slider from "@react-native-community/slider";

const PriceRangeScreen = () => {
  const [visible, setVisible] = useState(false);
  const [priceRange, setPriceRange] = useState([10, 50]);

  return (
    <View style={styles.container}>
      <Popable
        position="bottom"
        style={{width:200}}
        backgroundColor="rgba(255, 255, 255, 1)"
        content={
          <View style={styles.popoverContent}>
            <Slider
              style={{ width: 200, height: 40 }}
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={priceRange[0]}
              onValueChange={(value) => setPriceRange([value, priceRange[1]])}
            />
          </View>
        }
      >
        <View
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            Price Range: ${priceRange[0]} - ${priceRange[1]}
          </Text>
        </View>
      </Popable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  popoverContent: {
    backgroundColor: "rgba(255, 255, 255, 1)",
    alignItems: "center",
    width:200
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  rangeText: {
    fontSize: 14,
    marginBottom: 10,
  },
});

export default PriceRangeScreen;
