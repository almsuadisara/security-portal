import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { signout } from './helpers/auth';
import { ToastContainer, toast } from 'react-toastify';

function App({ history }) {
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5000'); // افتح الاتصال على نفس المنفذ الذي يعمل عليه الخادم

    // استقبال الرسائل من الخادم
    ws.onmessage = (event) => {
      if (event.data === 'Your session has expired. Please log in again.') {
        // عرض إشعار عند تلقي رسالة انتهاء الجلسة
        toast.error('Your session has expired. Please log in again.');
        // إعادة توجيه المستخدم إلى صفحة تسجيل الدخول
        history.push('/login');
      }
    };

    // إغلاق الاتصال عند مغادرة الصفحة
    return () => {
      ws.close();
    };
  }, [history]);

  return (
    <div className='min-h-screen bg-gray-100 text-gray-900 flex justify-center'>
      <ToastContainer />
      <div className='max-w-screen-xl m-0 sm:m-20 bg-white shadow sm:rounded-lg flex justify-center flex-1'>
        <div className='lg:w-1/2 xl:w-8/12 p-6 sm:p-12'>
          <div className='mt-12 flex flex-col items-center'>
            <h1 className='text-2xl xl:text-2xl font-extrabold text-center'>
        
              مرحبا بكم في بوابة الدخول الآمنة
            </h1>
            <div className='w-full flex-1 mt-8 text-indigo-500'>
              <div className='my-12 border-b text-center'>
                <div className='leading-none px-2 inline-block text-sm text-gray-600 tracking-wide font-medium bg-white transform translate-y-1/2'>
                  الميزات
                </div>
              </div>
              <div className='mx-auto max-w-xs relative'>
                <Link
                  to='/login'
                  className='mt-5 tracking-wide font-semibold bg-indigo-500 text-gray-100 w-full py-4 rounded-lg hover:bg-indigo-700 transition-all duration-300 ease-in-out flex items-center justify-center focus:shadow-outline focus:outline-none'
                >
                  <i className='fas fa-sign-in-alt w-6 -ml-2' />
                  <span className='mr-3'>تسجيل الدخول</span>
                </Link>
                <Link
                  to='/register'
                  className='mt-5 tracking-wide font-semibold bg-gray-500 text-gray-100 w-full py-4 rounded-lg hover:bg-gray-700 transition-all duration-300 ease-in-out flex items-center justify-center focus:shadow-outline focus:outline-none'
                >
                  <i className='fas fa-user-plus w-6 -ml-2' />
                  <span className='mr-3'>إنشاء حساب</span>
                </Link>
                <Link
                  to='/private'
                  className='mt-5 tracking-wide font-semibold bg-orange-500 text-gray-100 w-full py-4 rounded-lg hover:bg-orange-700 transition-all duration-300 ease-in-out flex items-center justify-center focus:shadow-outline focus:outline-none'
                >
                  <i className='fas fa-sign-in-alt w-6 -ml-2' />

                  <span className='mr-3'>لوحة التحكم الشخصية</span>
                </Link>
                <Link
                  to='/admin'
                  className='mt-5 tracking-wide font-semibold bg-green-500 text-gray-100 w-full py-4 rounded-lg hover:bg-green-700 transition-all duration-300 ease-in-out flex items-center justify-center focus:shadow-outline focus:outline-none'
                >
                  <i className='fas fa-sign-in-alt w-6 -ml-2' />
                  <span className='ml-3'>Admin Dashboard</span>

                  <span className='mr-3'>لوحة التحكم الإدارية</span>
                </Link>
                <button
                  onClick={() => {
                    signout(() => {
                      toast.error('تم تسجيل الخروج بنجاح');
                      history.push('/');
                    });
                  }}
                  className='mt-5 tracking-wide font-semibold bg-pink-500 text-gray-100 w-full py-4 rounded-lg hover:bg-pink-700 transition-all duration-300 ease-in-out flex items-center justify-center focus:shadow-outline focus:outline-none'
                >
                  <i className='fas fa-sign-out-alt w-6 -ml-2' />

                  <span className='mr-3'>تسجيل الخروج</span>

                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
}

export default App;
