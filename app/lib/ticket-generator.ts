import { Sale } from "./types";

export function generateTicket(products: Sale[]): void {
  const date: string = new Date().toLocaleDateString("es-AR");
  const saleNumber: string = products[0]?.sale_number || "N/A";
  const customerName: string = products[0]?.customer_name || "Consumidor Final";
  const customerCuit: string = products[0]?.customer_email || "Sin CUIT";
  const paymentMethod: string = products[0]?.payment_method || "cash";

  console.log("products on generateTicket", products);

  const total: number = products.reduce(
    (acc, p) => acc + p.unit_price * p.quantity,
    0
  );
  const totalDiscount = products.reduce(
    (acc, p) => acc + (p?.discount_amount || 0),
    0
  );

  const paymentMethodLabels: Record<string, string> = {
    cash: "Efectivo",
    card: "Tarjeta",
    transfer: "Transferencia",
    other: "Otro",
  };

  const content = `
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Factura ${saleNumber}</title>
    <style>
      body {
        font-family: 'Courier New', monospace;
        font-size: 12px;
        color: #000;
        margin: 0;
        padding: 20px 40px;
      }
      .invoice {
        width: 100%;
        max-width: 750px;
        margin: 0 auto;
        border: 1px solid #000;
        padding: 20px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        border-bottom: 2px solid #000;
        padding-bottom: 10px;
        margin-bottom: 15px;
      }
      .column {
        width: 48%;
      }
      .column h2 {
        margin: 0;
        font-size: 16px;
      }
      .column p {
        margin: 3px 0;
        line-height: 1.3;
      }
      .section-title {
        border-top: 1px solid #000;
        border-bottom: 1px solid #000;
        text-align: center;
        font-weight: bold;
        padding: 4px 0;
        margin: 10px 0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 6px;
      }
      th, td {
        border-bottom: 1px dotted #999;
        text-align: left;
        padding: 4px;
      }
      th {
        border-bottom: 1px solid #000;
        font-weight: bold;
      }
      .right {
        text-align: right;
      }
      .totals {
        margin-top: 15px;
        border-top: 2px solid #000;
        padding-top: 8px;
      }
      .totals div {
        display: flex;
        justify-content: space-between;
        margin: 4px 0;
      }
      .footer {
        text-align: center;
        margin-top: 20px;
        font-size: 11px;
        border-top: 1px solid #000;
        padding-top: 6px;
      }
      @media print {
        body { margin: 0; padding: 0; }
        .invoice { width: 100%; border: none; }
      }
    </style>
  </head>
  <body onload="window.print()">
    <div class="invoice">
      <div class="header">
        <div class="column">
          <h2>CINALLI LUBRICENTRO</h2>
          <p>MARIA FERNANDA DELAFENETRE</p>
          <p>27-28742347-6</p>
          <p>Esq 39 y 28</p>
        </div>
        <div class="column" style="text-align: right;">
          <p><strong>Factura C</strong></p>
          <p><strong>N°:</strong> ${saleNumber}</p>
          <p><strong>Fecha de Emisión:</strong> ${date}</p>
          <p><strong>Cliente:</strong> ${customerName}</p>
          <p><strong>CUIT:</strong> ${customerCuit}</p>
          <p><strong>Condición de Venta:</strong> Contado</p>
          <p><strong>Método de Pago:</strong> ${
            paymentMethodLabels[paymentMethod]
          }</p>
        </div>
      </div>

      <div class="section-title">DETALLE DE PRODUCTOS / SERVICIOS</div>

      <table>
        <tr>
          <th>Descripción</th>
          <th class="right">Cantidad</th>
          <th class="right">P. Unitario</th>
          <th class="right">Importe</th>
        </tr>
        ${products
          .map(
            (p) => `
          <tr>
            <td>${p.product_name}</td>
            <td class="right">${p.quantity}</td>
            <td class="right">$${p.unit_price.toLocaleString()}</td>
            <td class="right">$${(
              p.unit_price * p.quantity
            ).toLocaleString()}</td>
          </tr>`
          )
          .join("")}
      </table>

      <div class="totals">
        <div><span>Subtotal:</span><span>$${total.toLocaleString()}</span></div>
        ${
          totalDiscount > 0
            ? `<div><span>Descuento:</span><span>-$${totalDiscount.toLocaleString()}</span></div>`
            : ""
        }
        <div><strong>Total:</strong><strong>$${(
          total - totalDiscount
        ).toLocaleString()}</strong></div>
      </div>

      <div class="footer">
        <p>Documento no válido como factura fiscal</p>
        <p><strong>¡Gracias por su compra!</strong></p>
      </div>
    </div>
  </body>
  </html>
  `;

  const newWindow = window.open("", "_blank");
  if (newWindow) {
    newWindow.document.write(content);
    newWindow.document.close();
  } else {
    console.error("No se pudo abrir la ventana para imprimir el ticket.");
  }
}
