import { takeLatest, call, put, all } from 'redux-saga/effects';
import { toast } from 'react-toastify';

import history from '~/services/history';
import { signInSuccess, signUpSuccess, signFailure } from './actions';

import api from '~/services/api';

export function* signIn({ payload }) {
  try {
    const { email, password } = payload;

    const response = yield call(api.post, 'sessions', {
      email,
      password,
    });

    const { token, user } = response.data;

    yield put(signInSuccess(token, user));

    history.push('/dashboard');
  } catch (err) {
    toast.error(
      err.response.data.error || 'Something is wrong... Check your credentials.'
    );
    yield put(signFailure());
  }
}

export function* signUp({ payload }) {
  try {
    const { name, email, password } = payload;

    yield call(api.post, 'users', {
      name,
      email,
      password,
    });

    yield put(signUpSuccess());

    history.push('/login');
    toast.success("Congratulations! You're registered!");
  } catch (err) {
    toast.error(
      err.response.data.error || 'Sorry, something is wrong. Try again later!'
    );

    yield put(signFailure());
  }
}

export default all([
  takeLatest('@auth/SIGN_IN_REQUEST', signIn),
  takeLatest('@auth/SIGN_UP_REQUEST', signUp),
]);
