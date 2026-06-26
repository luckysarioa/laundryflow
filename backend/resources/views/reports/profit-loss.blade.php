<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Laba/Rugi</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
        .header h1 { font-size: 18px; margin: 0; }
        .header p { margin: 5px 0 0; color: #666; }
        .period { text-align: center; font-size: 14px; margin-bottom: 20px; color: #555; }
        .summary { display: flex; justify-content: space-around; margin-bottom: 30px; }
        .summary-box { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px; width: 30%; }
        .summary-box.revenue { border-color: #22c55e; background: #f0fdf4; }
        .summary-box.expense { border-color: #ef4444; background: #fef2f2; }
        .summary-box.profit { border-color: #3b82f6; background: #eff6ff; }
        .summary-box h3 { margin: 0 0 5px; font-size: 12px; color: #666; }
        .summary-box .value { font-size: 18px; font-weight: bold; }
        .summary-box.revenue .value { color: #16a34a; }
        .summary-box.expense .value { color: #dc2626; }
        .summary-box.profit .value { color: #2563eb; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 8px 12px; border: 1px solid #ddd; text-align: left; }
        th { background: #f5f5f5; font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .section-title { font-size: 14px; font-weight: bold; margin: 20px 0 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #999; }
    </style>
</head>
<body>
    <div class="header">
        <h1>LAPORAN LABA/RUGI</h1>
        <p>LaundryFlow</p>
    </div>

    <div class="period">
        Periode: {{ $dari }} — {{ $sampai }}
    </div>

    <div class="summary">
        <div class="summary-box revenue">
            <h3>Total Pendapatan</h3>
            <div class="value">Rp {{ number_format($totalRevenue, 0, ',', '.') }}</div>
        </div>
        <div class="summary-box expense">
            <h3>Total Pengeluaran</h3>
            <div class="value">Rp {{ number_format($totalExpenses, 0, ',', '.') }}</div>
        </div>
        <div class="summary-box profit">
            <h3>Laba/Rugi</h3>
            <div class="value">Rp {{ number_format($profit, 0, ',', '.') }}</div>
        </div>
    </div>

    @if($expenseByCategory->count() > 0)
    <div class="section-title">Rincian Pengeluaran per Kategori</div>
    <table>
        <thead>
            <tr>
                <th>Kategori</th>
                <th class="text-right">Nominal</th>
                <th class="text-right">Persentase</th>
            </tr>
        </thead>
        <tbody>
            @foreach($expenseByCategory as $kategori => $nominal)
            <tr>
                <td>{{ $kategori }}</td>
                <td class="text-right">Rp {{ number_format($nominal, 0, ',', '.') }}</td>
                <td class="text-right">{{ $totalExpenses > 0 ? round(($nominal / $totalExpenses) * 100, 1) : 0 }}%</td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td><strong>Total</strong></td>
                <td class="text-right"><strong>Rp {{ number_format($totalExpenses, 0, ',', '.') }}</strong></td>
                <td class="text-right"><strong>100%</strong></td>
            </tr>
        </tfoot>
    </table>
    @endif

    <div class="footer">
        Dikelola oleh LaundryFlow • Dicetak: {{ now()->format('d/m/Y H:i') }}
    </div>
</body>
</html>
