// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

let _supabase = null

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
	_supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
} else {
	console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing — using local fallback supabase stub for development')

	const listeners = new Set()
	const users = new Map()

	// Try to populate users map from a static seed file served from `public/dev-seed.json`.
	// This allows persistent dev accounts across dev-server restarts.
	;(async function loadSeed(){
		try{
			const res = await fetch('/dev-seed.json')
			if(!res.ok) return
			const json = await res.json()
			if(Array.isArray(json.users)){
				for(const u of json.users){
					const id = u.id || generateId()
					users.set(u.email, { id, email: u.email, password: u.password, full_name: u.full_name || null, role: u.role || null })
				}
			}
		}catch(e){
			// ignore — no seed available
		}
	})()

	function generateId() { return 'local-' + Math.random().toString(36).slice(2, 10) }

	const stub = {
		auth: {
			async getSession() { return { data: { session: stub.auth._session || null } } },
			onAuthStateChange(callback) {
				listeners.add(callback)
				return { data: { subscription: { unsubscribe() { listeners.delete(callback) } } } }
			},
			async signUp({ email, password }) {
				if (users.has(email)) {
					const existing = users.get(email)
					const user = { id: existing.id, email }
					stub.auth._session = { user }
					listeners.forEach(cb => { try { cb('SIGNED_IN', { user }) } catch (e) {} })
					return { data: { user } }
				}
				const id = generateId()
				users.set(email, { id, email, password, full_name: null, role: 'learner' })
				const user = { id, email }
				stub.auth._session = { user }
				listeners.forEach(cb => { try { cb('SIGNED_IN', { user }) } catch (e) {} })
				return { data: { user } }
			},
			async signInWithPassword({ email, password }) {
				const u = users.get(email)
				if (!u || u.password !== password) {
					return { error: { message: 'Invalid login credentials' }, data: null }
				}
				const user = { id: u.id, email }
				stub.auth._session = { user }
				listeners.forEach(cb => { try { cb('SIGNED_IN', { user }) } catch (e) {} })
				return { data: { user } }
			},
			async signOut() {
				stub.auth._session = null
				listeners.forEach(cb => { try { cb('SIGNED_OUT', null) } catch (e) {} })
				return { data: null }
			},
			_session: null
		},
		from(table) {
			return {
				select(selectCols) {
					return {
						eq: async (field, value) => {
							if (table === 'profiles' && field === 'id') {
								const found = Array.from(users.values()).find(u => u.id === value)
								if (found) return { data: { role: found.role, full_name: found.full_name }, error: null }
								return { data: null, error: null }
							}
							return { data: null, error: null }
						},
						maybeSingle: async () => ({ data: null, error: null })
					}
				},
				upsert: async (obj) => {
					if (table === 'profiles' && obj?.id) {
						const existing = Array.from(users.values()).find(u => u.id === obj.id)
						if (existing) {
							existing.full_name = obj.full_name || existing.full_name
							existing.role = obj.role || existing.role
							return { data: existing, error: null }
						} else {
							users.set(obj.email || obj.id, { id: obj.id, email: obj.email || null, password: null, full_name: obj.full_name || null, role: obj.role || null })
							return { data: obj, error: null }
						}
					}
					return { data: obj, error: null }
				}
			}
		}
	}

	_supabase = stub
}

export const supabase = _supabase
export const isSupabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)