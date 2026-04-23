export const getAvatarInitials = (name?: string | null): string => {
  const trimmedName = (name || '').trim();

  if (!trimmedName) {
    return '';
  }

  const nameParts = trimmedName.split(/\s+/).filter(Boolean);

  if (nameParts.length === 1) {
    return (nameParts[0][0] || '').toUpperCase();
  }

  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];
  const firstInitial = firstName[0] || '';
  let secondInitial = lastName[0] || '';

  if (firstInitial.toUpperCase() === secondInitial.toUpperCase()) {
    const alternateChar =
      lastName
        .slice(1)
        .split('')
        .find(char => char.toUpperCase() !== firstInitial.toUpperCase()) ||
      firstName
        .slice(1)
        .split('')
        .find(char => char.toUpperCase() !== firstInitial.toUpperCase()) ||
      secondInitial;

    secondInitial = alternateChar;
  }

  return `${firstInitial}${secondInitial}`.toUpperCase();
};
