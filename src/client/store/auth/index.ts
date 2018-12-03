import { Module } from 'vuex'

import { AuthState, User } from './types'
import { RootState } from '../types'
import { actions } from './actions'
import { getters } from './getters'
import { mutations } from './mutations'

const state: AuthState = {
  user: null,
  isAuthed: false,
  token: null
}

export const auth: Module<AuthState, RootState> = {
  namespaced: false,
  state,
  getters,
  actions,
  mutations
}