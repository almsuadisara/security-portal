import React, { useState } from 'react';
import authSvg from '../assests/auth.svg';
import { ToastContainer, toast } from 'react-toastify';
import axios from 'axios';
import { authenticate, isAuth } from '../helpers/auth';
import { Link, Redirect } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password1: '',
    password2: '',
    textChange: 'تسجيل'
  });

  const [passwordError, setPasswordError] = useState('');
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('');

  const { name, email, password1, password2, textChange } = formData;

  const validatePasswordStrength = password => {
    const lengthValid = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const validPassword =
      lengthValid && hasUpperCase && hasNumber && hasSpecialChar;

    if (!validPassword) {
      setPasswordStrengthMessage(
        'يجب أن تكون كلمة المرور مكونة من 8 أحرف على الأقل، وتحتوي على حرف كبير، ورقم، ورمز خاص.'
      );
    } else {
      setPasswordStrengthMessage('');
    }
    return validPassword;
  };

  const handleChange = text => e => {
    setFormData({ ...formData, [text]: e.target.value });
    if (text === 'password1') {
      setPasswordStrengthMessage('');
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (name && email && password1) {
      if (password1 === password2) {
        if (validatePasswordStrength(password1)) {
          setFormData({ ...formData, textChange: 'جارٍ الإرسال' });
          console.log(process.env.REACT_APP_API_URL);

          axios.post(`${process.env.REACT_APP_API_URL}/register`, {
              name,
              email,
              password: password1
            })
            .then(res => {
              setFormData({
                ...formData,
                name: '',
                email: '',
                password1: '',
                password2: '',
                textChange: 'تم الإرسال'
              });

              toast.success(res.data.message);
            })
            .catch(err => {
              setFormData({
                  ...formData,
                  password1: '',
                  password2: '',
                  textChange: 'تسجيل'
              });
          
              console.log(err.response);
          
              if (err.response && err.response.data) {
                  toast.error(err.response.errors || 'حدث خطأ. يرجى المحاولة مرة أخرى لاحقًا.');
              } else {
                  toast.error('حدث خطأ. يرجى المحاولة مرة أخرى لاحقًا.');
              }
          });
        }
      } else {
        toast.error("كلمتا المرور غير متطابقتين");
      }
    } else {
      toast.error('يرجى ملء جميع الحقول');
    }
  };

  return (
    <div className='min-h-screen bg-gray-100 text-gray-900 flex justify-center'>
      {isAuth() ? <Redirect to='/' /> : null}
      <ToastContainer />
      <div className='max-w-screen-xl m-0 sm:m-20 bg-white shadow sm:rounded-lg flex justify-center flex-1'>
        <div className='lg:w-1/2 xl:w-5/12 p-6 sm:p-12'>
          <div className='mt-12 flex flex-col items-center'>
            <h1 className='text-2xl xl:text-3xl font-extrabold'>
              التسجيل في البوابة الآمنة
            </h1>

            <form
              className='w-full flex-1 mt-8 text-indigo-500'
              onSubmit={handleSubmit}
            >
              <div className='mx-auto max-w-xs relative '>
                <input
                  className='w-full px-8 py-4 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white'
                  type='text'
                  placeholder='الاسم'
                  onChange={handleChange('name')}
                  value={name}
                />
                <input
                  className='w-full px-8 py-4 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white mt-5'
                  type='email'
                  placeholder='البريد الإلكتروني'
                  onChange={handleChange('email')}
                  value={email}
                />
                <input
                  className='w-full px-8 py-4 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white mt-5'
                  type='password'
                  placeholder='كلمة المرور'
                  onChange={handleChange('password1')}
                  value={password1}
                />
                {passwordStrengthMessage && (
                  <small className="text-red-500 text-xs mt-2">{passwordStrengthMessage}</small>
                )}
                <input
                  className='w-full px-8 py-4 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white mt-5'
                  type='password'
                  placeholder='تأكيد كلمة المرور'
                  onChange={handleChange('password2')}
                  value={password2}
                />
                <button
                  type='submit'
                  className='mt-5 tracking-wide font-semibold bg-indigo-500 text-gray-100 w-full py-4 rounded-lg hover:bg-indigo-700 transition-all duration-300 ease-in-out flex items-center justify-center focus:shadow-outline focus:outline-none'
                >
                  <i className='fas fa-user-plus fa 1x w-6 -ml-2' />
                  <span className='ml-3'>{textChange}</span>
                </button>
              </div>
              <div className='my-12 border-b text-center'>
                <div className='leading-none px-2 inline-block text-sm text-gray-600 tracking-wide font-medium bg-white transform translate-y-1/2'>
                اذا كان لديك حساب قم بتسجيل الدخول  
                </div>
              </div>
              <div className='flex flex-col items-center'>
                <a
                  className='w-full max-w-xs font-bold shadow-sm rounded-lg py-3 bg-indigo-100 text-gray-800 flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none hover:shadow focus:shadow-sm focus:shadow-outline mt-5'
                  href='/login'
                  target='_self'
                >
                  <i className='fas fa-sign-in-alt fa 1x w-6 -ml-2 text-indigo-500' />
                  <span className='ml-4'>تسجيل الدخول</span>
                </a>
              </div>
            </form>
          </div>
        </div>
        <div className='flex-1 bg-indigo-100 text-center hidden lg:flex'>
          <div
            className='m-12 xl:m-16 w-full bg-contain bg-center bg-no-repeat'
            style={{ backgroundImage: `url(${authSvg})` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default Register;
