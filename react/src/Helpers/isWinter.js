const isWinterTheme = () => {
  const month = new Date().getMonth();
  return month >= 10 || month <= 2;
};

export default isWinterTheme;