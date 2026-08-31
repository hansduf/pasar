import { Transaction, CartItem } from './supabase';

/**
 * Format receipt text for WhatsApp Share or Preview
 */
export function generateReceiptText(transaction: Transaction): string {
  const dateStr = new Date(transaction.created_at || Date.now()).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  let text = `=================================\n`;
  text += `        TOKO PASAR GROSIR        \n`;
  text += `   Resi Penjualan / Struk Nota   \n`;
  text += `=================================\n`;
  text += `No. Nota : ${transaction.transaction_no}\n`;
  text += `Tanggal  : ${dateStr}\n`;
  text += `Pelanggan: ${transaction.customer_name || 'Umum'}\n`;
  text += `=================================\n`;

  if (transaction.items && transaction.items.length > 0) {
    transaction.items.forEach((item) => {
      text += `${item.product_name}\n`;
      const qtyUnit = `${item.qty} ${item.unit_name}`;
      const priceFmt = `Rp ${item.price.toLocaleString('id-ID')}`;
      const subtotalFmt = `Rp ${item.subtotal.toLocaleString('id-ID')}`;
      
      if (item.is_bonus) {
        text += `  ${qtyUnit} @ Rp 0 [BONUS FREE]\n`;
      } else {
        text += `  ${qtyUnit} @ ${priceFmt} = ${subtotalFmt}\n`;
      }

      if (item.notes) {
        text += `  * Catatan: ${item.notes}\n`;
      }
    });
  }

  text += `=================================\n`;
  text += `TOTAL BAYAR: Rp ${transaction.total_amount.toLocaleString('id-ID')}\n`;
  if (transaction.cash_received && transaction.cash_received > 0) {
    text += `Tunai      : Rp ${transaction.cash_received.toLocaleString('id-ID')}\n`;
    text += `Kembali    : Rp ${(transaction.change_amount || 0).toLocaleString('id-ID')}\n`;
  } else {
    text += `Metode     : ${transaction.payment_method || 'Tunai'}\n`;
  }
  text += `=================================\n`;
  text += `   Terima Kasih Atas Kunjungan   \n`;
  text += `      Semoga Rezeki Berkah       \n`;
  text += `=================================\n`;

  return text;
}

/**
 * Direct ESC/POS Bluetooth Thermal Printing via Web Bluetooth API
 */
export async function printViaBluetooth(transaction: Transaction): Promise<boolean> {
  const nav = navigator as any;
  if (!nav || !nav.bluetooth) {
    alert('Browser ini belum mendukung Web Bluetooth API. Gunakan Chrome di Android/PC.');
    return false;
  }

  try {
    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2']
    });

    if (!device.gatt) {
      throw new Error('Bluetooth GATT server error');
    }

    const server = await device.gatt.connect();
    
    // Attempt to discover print service
    const services = await server.getPrimaryServices();
    if (services.length === 0) {
      throw new Error('No Bluetooth services found on printer');
    }

    const service = services[0];
    const characteristics = await service.getCharacteristics();
    if (characteristics.length === 0) {
      throw new Error('No Bluetooth characteristics found on printer');
    }

    const characteristic = characteristics[0];

    // Encode receipt text to ESC/POS binary format
    const receiptText = generateReceiptText(transaction) + '\n\n\n';
    const encoder = new TextEncoder();
    const data = encoder.encode(receiptText);

    await characteristic.writeValue(data);
    return true;
  } catch (error: any) {
    console.error('Bluetooth Print Error:', error);
    // User cancelled or connection failed
    return false;
  }
}
