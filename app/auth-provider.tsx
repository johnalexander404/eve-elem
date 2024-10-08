'use client'

import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import {
  ApplicationVerifier,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  PhoneAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signOut,
  User
} from 'firebase/auth'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, getDocs, getDoc, setDoc, doc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
export const db = getFirestore(app)

interface AuthContextType {
  user: User | null
  isAdmin: boolean
  signInWithGoogle: () => Promise<void>
  signInWithPhone: (phoneNumber: string) => Promise<string>
  verifyOtp: (verificationId: string, otp: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  signInWithGoogle: async () => {},
  signInWithPhone: async () => '',
  verifyOtp: async () => {},
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      // Check if the user is an admin by querying the Firestore collection
      if (user) {
        const userEmail = user.email || ''
        const isAdminUser = await checkIfAdmin(userEmail)
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', user.uid), {
            name: user.displayName,
            email: user.email
          })
        }
        setIsAdmin(isAdminUser)
      } else {
        setIsAdmin(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const checkIfAdmin = async (email: string): Promise<boolean> => {
    try {
      const q = query(collection(db, 'admins')) // Assuming the collection is named 'admins'
      const querySnapshot = await getDocs(q)
      const adminEmails: string[] = []

      querySnapshot.forEach((doc) => {
        const adminData = doc.data()
        if (adminData.email) {
          adminEmails.push(adminData.email) // Assumes each admin document has an "email" field
        }
      })

      return adminEmails.includes(email)
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false
    }
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error('Error signing in with Google:', error)
    }
  }

  const signInWithPhone = async (phoneNumber: string) => {
    const provider = new PhoneAuthProvider(auth)
    const appVerifier: ApplicationVerifier = {
      type: 'recaptcha',
      verify: async () => ''
    }
    try {
      return await provider.verifyPhoneNumber(phoneNumber, appVerifier)
    } catch (error) {
      console.error('Error sending OTP:', error)
      throw error
    }
  }

  const verifyOtp = async (verificationId: string, otp: string) => {
    const credential = PhoneAuthProvider.credential(verificationId, otp)
    try {
      await signInWithCredential(auth, credential)
    } catch (error) {
      console.error('Error verifying OTP:', error)
      throw error
    }
  }

  const signOutUser = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
      <AuthContext.Provider value={{ user, isAdmin, signInWithGoogle, signInWithPhone, verifyOtp, signOut: signOutUser }}>
        {children}
      </AuthContext.Provider>
  )
}
