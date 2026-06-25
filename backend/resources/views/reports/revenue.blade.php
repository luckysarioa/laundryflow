<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Pendapatan - LaundryFlow</title>
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
        .header .period {
            font-size: 14px;
            color: #374151;
            margin-top: 10px;
            font-weight: 600;
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
        .summary-card .value.emerald {
            color: #059669;
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
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #9ca3af;
        }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
        }
        .badge-emerald {
            background: #d1fae5;
            color: #065f46;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>LaundryFlow</h1>
            <h2>Laporan Pendapatan</h2>
            <div class="period">{{ $dari }} — {{ $sampai }}</div>
        </div>

        <div class="summary">
            <div class="summary-card">
                <div class="label">Total Pendapatan</div>
                <div class="value emerald">Rp {{ number_format($totalOmzet, 0, ',', '.') }}</div>
            </div>
            <div class="summary-card">
                <div class="label">Total Order</div>
                <div class="value">{{ $totalOrder }}</div>
            </div>
            <div class="summary-card">
                <div class="label">Rata-rata/Hari</div>
                <div class="value">Rp {{ number_format($avgPerHari, 0, ',', '.') }}</div>
            </div>
        </div>

        <h3 style="font-size: 14px; color: #1f2937; margin-bottom: 15px;">Detail Pendapatan Harian</h3>

        <table>
            <thead>
                <tr>
                    <th>Tanggal</th>
                    <th class="text-center">Jumlah Order</th>
                    <th class="text-right">Pendapatan</th>
                </tr>
            </thead>
            <tbody>
                @forelse($dailyData as $day)
                <tr>
                    <td class="font-medium">{{ $day['tanggal'] }}</td>
                    <td class="text-center">{{ $day['jumlah_order'] }}</td>
                    <td class="text-right">Rp {{ number_format($day['omzet'], 0, ',', '.') }}</td>
                </tr>
                @empty
                <tr>
                    <td colspan="3" class="text-center" style="padding: 20px; color: #9ca3af;">
                        Tidak ada data pendapatan pada periode ini.
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>

        <h3 style="font-size: 14px; color: #1f2937; margin-bottom: 15px;">Daftar Order Lunas</h3>

        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Pelanggan</th>
                    <th>Layanan</th>
                    <th class="text-right">Berat</th>
                    <th class="text-right">Total</th>
                    <th>Tanggal</th>
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
                    <td>{{ $order->tgl_masuk->format('d/m/Y H:i') }}</td>
                </tr>
                @empty
                <tr>
                    <td colspan="6" class="text-center" style="padding: 20px; color: #9ca3af;">
                        Tidak ada order pada periode ini.
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
