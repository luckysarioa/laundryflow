<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Order - LaundryFlow</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            font-size: 12px;
            color: #333;
            line-height: 1.5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2563eb;
        }
        .header h1 {
            font-size: 24px;
            color: #1e40af;
            margin-bottom: 5px;
        }
        .header h2 {
            font-size: 16px;
            color: #6b7280;
            font-weight: normal;
        }
        .header .filter {
            font-size: 12px;
            color: #6b7280;
            margin-top: 10px;
        }
        .summary {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            gap: 15px;
        }
        .summary-card {
            flex: 1;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        }
        .summary-card .label {
            font-size: 11px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .summary-card .value {
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        thead th {
            background: #2563eb;
            color: white;
            padding: 10px 12px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        thead th:first-child {
            border-radius: 6px 0 0 0;
        }
        thead th:last-child {
            border-radius: 0 6px 0 0;
        }
        tbody td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        tbody tr:nth-child(even) {
            background: #f9fafb;
        }
        tbody tr:hover {
            background: #f3f4f6;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .font-medium {
            font-weight: 600;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
        }
        .badge-antrian {
            background: #dbeafe;
            color: #1e40af;
        }
        .badge-cuci {
            background: #fef3c7;
            color: #92400e;
        }
        .badge-setrika {
            background: #e0e7ff;
            color: #3730a3;
        }
        .badge-siap {
            background: #d1fae5;
            color: #065f46;
        }
        .badge-diambil {
            background: #f3f4f6;
            color: #374151;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #9ca3af;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>LaundryFlow</h1>
            <h2>Daftar Order</h2>
            <div class="filter">
                @if($dari && $sampai)
                    Periode: {{ $dari }} — {{ $sampai }}
                @else
                    Semua periode
                @endif
                @if($status)
                    | Status: {{ ucfirst($status) }}
                @endif
            </div>
        </div>

        <div class="summary">
            <div class="summary-card">
                <div class="label">Total Order</div>
                <div class="value">{{ $orders->count() }}</div>
            </div>
            <div class="summary-card">
                <div class="label">Total Berat</div>
                <div class="value">{{ number_format($orders->sum('total_berat'), 1) }} kg</div>
            </div>
            <div class="summary-card">
                <div class="label">Total Pendapatan</div>
                <div class="value" style="color: #059669;">Rp {{ number_format($orders->sum('total_harga'), 0, ',', '.') }}</div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Pelanggan</th>
                    <th>Layanan</th>
                    <th class="text-right">Berat</th>
                    <th class="text-right">Total</th>
                    <th>Status</th>
                    <th>Tanggal Masuk</th>
                </tr>
            </thead>
            <tbody>
                @forelse($orders as $order)
                <tr>
                    <td class="font-medium">#{{ $order->id }}</td>
                    <td>{{ $order->customer->nama ?? '-' }}</td>
                    <td>{{ $order->service->nama_layanan ?? '-' }}</td>
                    <td class="text-right">{{ $order->total_berat }} kg</td>
                    <td class="text-right font-medium">Rp {{ number_format($order->total_harga, 0, ',', '.') }}</td>
                    <td>
                        <span class="badge badge-{{ $order->status }}">
                            {{ ucfirst($order->status) }}
                        </span>
                    </td>
                    <td>{{ $order->tgl_masuk->format('d/m/Y H:i') }}</td>
                </tr>
                @empty
                <tr>
                    <td colspan="7" class="text-center" style="padding: 20px; color: #9ca3af;">
                        Tidak ada order ditemukan.
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>

        <div class="footer">
            <span>Dicetak pada: {{ now()->format('d F Y H:i') }}</span>
            <span>LaundryFlow - Sistem Manajemen Laundry</span>
        </div>
    </div>
</body>
</html>
