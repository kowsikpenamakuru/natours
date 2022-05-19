/* eslint-disable */
import { showAlert } from './alerts';

export const login = async function (email, password) {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      window.setTimeout(() => location.assign('/'), 1500);
    }
  } catch (e) {
    showAlert('error', e.response.data.message);
  }
};

export const logout = async function () {
  try {
    console.log('Inside logout');

    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout',
    });

    console.log('Inside logout');

    if (res.data.status === 'success') {
      showAlert('success', 'Logged out successfully');
      location.reload(true);
    }
  } catch (e) {
    console.log(e);
    showAlert('error', 'Error logging out. Please try again!');
  }
};
