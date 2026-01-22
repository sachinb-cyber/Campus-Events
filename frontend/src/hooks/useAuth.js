import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        handleUser(data.session.user)
      } else {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          handleUser(session.user)
        } else {
          setUser(null)
          setRole(null)
          setLoading(false)
        }
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleUser(authUser) {
    setUser(authUser)

    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authUser.id)
      .maybeSingle()

    if (!data) {
      let assignedRole = 'student'
      if (authUser.email === 'superadmin@college.edu') assignedRole = 'super_admin'
      else if (authUser.email === 'admin@college.edu') assignedRole = 'admin'

      await supabase.from('profiles').insert({
        id: authUser.id,
        email: authUser.email,
        role: assignedRole
      })

      setRole(assignedRole)
    } else {
      setRole(data.role)
    }

    setLoading(false)
  }

  return { user, role, loading }
}
