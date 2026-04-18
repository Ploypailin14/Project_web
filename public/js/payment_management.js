document.addEventListener('DOMContentLoaded', () => {
    loadPayments();
});

// 1. ดึงข้อมูลประวัติการชำระเงิน
async function loadPayments() {
    const tbody = document.getElementById('payment-body');
    try {
        const res = await fetch('/admin/payments');
        const data = await res.json();

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-500 font-bold text-lg">ยังไม่มีข้อมูลการชำระเงิน</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(pay => {
            const dateStr = pay.payment_date ? new Date(pay.payment_date).toLocaleString('th-TH') : '-';
            
            return `
            <tr class="hover:bg-gray-50 border-b transition-colors">
                <td class="font-black text-gray-500">PAY-${pay.payment_id}</td>
                <td class="font-bold text-blue-600">Order #${pay.order_id}</td>
                <td class="text-sm font-bold text-gray-500">${dateStr}</td>
                <td class="text-right font-black text-orange-600 text-xl">${Number(pay.amount).toLocaleString()} ฿</td>
                <td class="text-center">
                    <button onclick="editPayment(${pay.payment_id}, ${pay.amount})" class="btn btn-sm bg-zinc-800 hover:bg-black text-white border-none rounded-lg shadow-sm">
                        ✏️ Edit Amount
                    </button>
                </td>
            </tr>
            `;
        }).join('');
    } catch (err) {
        console.error("Error loading payments:", err);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-red-500 font-bold py-8">ไม่สามารถโหลดข้อมูลได้</td></tr>`;
    }
}

// 2. ฟังก์ชันแก้ไขยอดเงิน
window.editPayment = function(paymentId, currentAmount) {
    Swal.fire({
        title: 'แก้ไขยอดชำระเงิน',
        text: `รหัสการชำระเงิน: PAY-${paymentId}`,
        input: 'number',
        inputValue: currentAmount,
        inputAttributes: {
            min: 0,
            step: 'any'
        },
        showCancelButton: true,
        confirmButtonText: 'บันทึกยอดใหม่',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#22c55e', // สีเขียว
        cancelButtonColor: '#6b7280',
        inputValidator: (value) => {
            if (!value) return 'กรุณาระบุยอดเงิน!';
            if (value < 0) return 'ยอดเงินห้ามติดลบ!';
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            const newAmount = result.value;
            
            try {
                const res = await fetch(`/admin/payment/${paymentId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: newAmount })
                });

                if (res.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'อัปเดตสำเร็จ!',
                        text: `เปลี่ยนยอดเงินเป็น ${newAmount} ฿ เรียบร้อยแล้ว`,
                        showConfirmButton: false,
                        timer: 1500
                    });
                    loadPayments(); // โหลดตารางใหม่
                } else {
                    const data = await res.json();
                    Swal.fire('ผิดพลาด', data.error || 'อัปเดตไม่สำเร็จ', 'error');
                }
            } catch (err) {
                Swal.fire('การเชื่อมต่อล้มเหลว', 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้', 'error');
            }
        }
    });
};