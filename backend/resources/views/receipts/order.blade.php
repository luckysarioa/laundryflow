<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Struk Order #{{ $order->id }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 12px; color: #333; padding: 20px; max-width: 300px; margin: 0 auto; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .border-top { border-top: 1px dashed #999; margin: 10px 0; }
        .border-bottom { border-bottom: 1px dashed #999; margin: 10px 0; }
        table { width: 100%; }
        td { padding: 2px 0; }
        .right { text-align: right; }
        .qr-section { text-align: center; margin: 15px 0; }
        .qr-section img { width: 120px; height: 120px; }
        .tracking-info { font-size: 9px; color: #666; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="center bold" style="font-size: 14px;">LAUNDRYFLOW</div>
    <div class="center" style="font-size: 10px; color: #666;">{{ $order->outlet?->name ?? 'Laundry' }}</div>
    <div class="center" style="font-size: 10px; color: #666;">{{ $order->outlet?->address ?? '' }}</div>

    <div class="border-top"></div>

    <table>
        <tr><td>No. Order</td><td class="right bold">#{{ $order->id }}</td></tr>
        <tr><td>Tanggal Masuk</td><td class="right">{{ $order->tgl_masuk?->format('d/m/Y H:i') }}</td></tr>
        <tr><td>Pelanggan</td><td class="right">{{ $order->customer->nama }}</td></tr>
        <tr><td>HP</td><td class="right">{{ $order->customer->no_hp }}</td></tr>
    </table>

    <div class="border-top"></div>

    <table>
        <tr><td>Layanan</td><td class="right">{{ $order->service->nama_layanan }}</td></tr>
        <tr><td>Berat</td><td class="right">{{ $order->total_berat }} kg</td></tr>
        <tr><td>Harga/kg</td><td class="right">Rp {{ number_format($order->service->harga_per_kilo, 0, ',', '.') }}</td></tr>
    </table>

    <div class="border-top"></div>

    <table>
        <tr><td class="bold">TOTAL</td><td class="right bold" style="font-size: 14px;">Rp {{ number_format($order->total_harga, 0, ',', '.') }}</td></tr>
    </table>

    <div class="border-top"></div>

    <table>
        <tr><td>Status</td><td class="right">{{ strtoupper($order->status) }}</td></tr>
        @if($order->tipe_pembayaran)
        <tr><td>Pembayaran</td><td class="right">{{ strtoupper($order->tipe_pembayaran) }}</td></tr>
        @endif
        @if($order->transactions->count() > 0)
        <tr><td>Lunas</td><td class="right">YA</td></tr>
        @endif
    </table>

    @if($order->catatan)
    <div class="border-top"></div>
    <div><strong>Catatan:</strong> {{ $order->catatan }}</div>
    @endif

    {{-- QR Code Section --}}
    <div class="qr-section">
        <div class="border-top"></div>
        <p class="bold" style="font-size: 11px; margin-bottom: 10px;">LACAK STATUS CUCIAN</p>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data={{ urlencode($trackingUrl) }}" alt="QR Code Tracking">
        <div class="tracking-info">
            Scan QR Code ini untuk melihat<br>status cucian Anda secara real-time
        </div>
        <div class="tracking-info" style="margin-top: 5px;">
            Atau kunjungi:<br>
            <strong>{{ $trackingUrl }}</strong>
        </div>
        <div class="border-bottom"></div>
    </div>

    {{-- Estimasi Selesai --}}
    @if($estimasi && $order->status !== 'diambil')
    <div class="center" style="font-size: 10px; color: #666; margin-bottom: 10px;">
        ⏱ Estimasi selesai: <strong>{{ $estimasi }}</strong>
    </div>
    @endif

    <div class="center" style="font-size: 10px; color: #999;">
        Terima kasih atas kunjungan Anda 🙏
    </div>
    <div class="center" style="font-size: 9px; color: #ccc; margin-top: 5px;">
        Dikelola oleh LaundryFlow
    </div>
</body>
</html>
