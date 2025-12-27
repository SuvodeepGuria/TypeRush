export let chartInstance = null;

export function renderResultChart(ctx, historyData) {
    if (chartInstance) {
        chartInstance.destroy();
    }

    const labels = historyData.map(d => d.time);
    const wpmData = historyData.map(d => d.wpm);
    const rawData = historyData.map(d => d.raw);
    const errorData = historyData.map(d => d.acc); // Maybe visualize errors separately later

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'WPM',
                    data: wpmData,
                    borderColor: '#e2b714',
                    backgroundColor: 'rgba(226, 183, 20, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 2
                },
                {
                    label: 'Raw',
                    data: rawData,
                    borderColor: '#646669',
                    borderDash: [5, 5],
                    tension: 0.4,
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index',
            },
            plugins: {
                legend: {
                    display: true,
                    labels: { color: '#888' }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Time (s)', color: '#888' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#888' }
                },
                y: {
                    title: { display: true, text: 'Words Per Minute', color: '#888' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#888' },
                    beginAtZero: true
                }
            }
        }
    });
}
