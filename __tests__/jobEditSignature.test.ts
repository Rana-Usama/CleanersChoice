import {jobEditSignature} from '../src/utils/jobEditSignature';

const original = {
  title: 'Cleaning', description: 'Windows', type: 'Window Cleaning', remarks: '',
  dueDate: '2026-10-01  10:00 AM',
  location: {latitude: 31, longitude: 74, name: 'Office'},
  budgetType: 'flat', budget: '100',
};

it('ignores formatting, empty optional values and non-editable fields', () => {
  expect(jobEditSignature({...original, title: ' Cleaning ', budget: '$100',
    remarks: undefined, createdAt2: new Date(),
    location: {name: 'Office', longitude: '74', latitude: '31'},
  })).toBe(jobEditSignature(original));
});

it.each([
  {title: 'New title'}, {description: 'New description'}, {remarks: 'Bring supplies'},
  {type: 'Car Cleaning'}, {dueDate: '2026-10-02  10:00 AM'}, {budget: '$101'},
  {location: {...original.location, latitude: 32}},
  {location: {...original.location, name: 'House'}},
  {budgetType: 'hourly', hourlyRate: '10', hours: '10'},
])('detects an edited field: %p', change => {
  expect(jobEditSignature({...original, ...change})).not.toBe(jobEditSignature(original));
});

it('does not count an edit that was reverted', () => {
  const changed = {...original, title: 'Different'};
  changed.title = original.title;
  expect(jobEditSignature(changed)).toBe(jobEditSignature(original));
});

it('detects hourly components changing even when the total is unchanged', () => {
  expect(jobEditSignature({...original, budgetType: 'hourly', hourlyRate: '10', hours: '10'}))
    .not.toBe(jobEditSignature({...original, budgetType: 'hourly', hourlyRate: '20', hours: '5'}));
});

it('compares square-foot rates and ignores hidden flat-budget fields', () => {
  const sqft = {...original, budgetType: 'sqft', pricePerSqFt: '2', sqFt: '50'};
  expect(jobEditSignature({...sqft, budget: '500'})).toBe(jobEditSignature(sqft));
  expect(jobEditSignature({...sqft, sqFt: '51'})).not.toBe(jobEditSignature(sqft));
});
