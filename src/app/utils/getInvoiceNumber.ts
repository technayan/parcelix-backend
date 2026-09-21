export const generateInvoiceNumber = () => {
  const prefix = "INV";
  const date = new Date();

  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const randomDigits = Math.floor(1000 + Math.random() * 9000);

  return `${prefix}-${year}${month}${day}-${randomDigits}`;
};
