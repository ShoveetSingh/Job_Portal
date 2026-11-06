function Payment(){

      const apiUrl=import.meta.env.VITE_API_URL;

     const pay= async()=>{

        try{
        const res = await fetch(`${apiUrl}/create-order`, {
    method: "POST",
    credentials: "include",

});
   const order = await res.json();

   const options = {
    key: order.key_id,
    amount: order.amount,
    currency: order.currency,
    order_id: order.order_id,

    name: "Job Portal",
    description: "Profile Access Payment",

    handler: async function (response) {
        try{
     const res = await fetch(`${apiUrl}/verify-payment`,{
    method:'POST',
    credentials:'include',
    headers: {
                            "Content-Type": "application/json"
                        },
    body: JSON.stringify(response)
     });
     const result = await res.json();
     console.log(result);
    }
    catch(error){
    console.log(error);
    }
    }
}
const razorpay = new window.Razorpay(options);
razorpay.open();
}

catch(error){
    console.log(error);
};

}


    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-8 rounded-xl shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-4">Complete Your Payment</h1>

          <p className="mb-6">
            Pay ₹499 to unlock profile updates and resume uploads.
          </p>

          <button
            onClick={pay}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
           click to pay
          </button>
        </div>
      </div>
    );
}
export default Payment;