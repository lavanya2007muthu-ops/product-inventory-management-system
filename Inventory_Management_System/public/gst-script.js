// GST Calculator
document.getElementById('gstForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const basePrice = parseFloat(document.getElementById('basePrice').value);
    const gstRate = parseFloat(document.getElementById('gstRate').value);
    
    const gstAmount = (basePrice * gstRate) / 100;
    const totalPrice = basePrice + gstAmount;
    
    document.getElementById('gstAmount').textContent = gstAmount.toFixed(2);
    document.getElementById('totalPrice').textContent = totalPrice.toFixed(2);
    document.getElementById('gstResult').style.display = 'block';
});

// Denomination Calculator
document.getElementById('denomForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('amount').value);
    
    const denominations = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1];
    let remaining = Math.floor(amount);
    const breakdown = {};
    
    denominations.forEach(denom => {
        if (remaining >= denom) {
            const count = Math.floor(remaining / denom);
            breakdown[denom] = count;
            remaining %= denom;
        }
    });
    
    const breakdownDiv = document.getElementById('denomBreakdown');
    breakdownDiv.innerHTML = '';
    
    for (const [denom, count] of Object.entries(breakdown)) {
        const p = document.createElement('p');
        p.textContent = `₹${denom}: ${count}`;
        breakdownDiv.appendChild(p);
    }
    
    document.getElementById('denomResult').style.display = 'block';
});