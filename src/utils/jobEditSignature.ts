/** Compare editable values only; generated timestamps and lifecycle are excluded. */
export const jobEditSignature = (form: Record<string, any>): string => {
  const text = (value: any) => String(value ?? '').trim();
  const amount = (value: any) => parseInt(text(value).replace(/[^0-9]/g, ''), 10) || 0;
  const budgetType = form.budgetType || 'flat';
  const location = form.location || {};
  return JSON.stringify({
    title: text(form.title),
    description: text(form.description),
    type: text(form.type),
    remarks: text(form.remarks),
    dueDate: form.dueDate,
    location: {
      latitude: location.latitude == null ? null : Number(location.latitude),
      longitude: location.longitude == null ? null : Number(location.longitude),
      name: text(location.name),
      city: text(location.city),
      state: text(location.state),
      postalCode: text(location.postalCode),
    },
    budgetType,
    budget: budgetType === 'flat' ? amount(form.budget) : null,
    hourlyRate: budgetType === 'hourly' ? amount(form.hourlyRate) : null,
    hours: budgetType === 'hourly' ? amount(form.hours) : null,
    pricePerSqFt: budgetType === 'sqft' ? amount(form.pricePerSqFt) : null,
    sqFt: budgetType === 'sqft' ? amount(form.sqFt) : null,
  });
};
