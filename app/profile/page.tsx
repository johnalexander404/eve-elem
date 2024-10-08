'use client'

import { useState, useEffect } from 'react'
import { useAuth} from '../auth-provider'
import {doc, getDoc, setDoc, collection, query, getDocs, getFirestore} from 'firebase/firestore'
import { useRouter } from 'next/navigation'


const db = getFirestore()

interface Child {
  name: string
  grade: string
}

interface UserProfile {
  name: string
  phoneNumber: string
  children: Child[]
}

export default function ProfilePage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    phoneNumber: '',
    children: []
  })
  const [allProfiles, setAllProfiles] = useState<{ [key: string]: UserProfile }>({})

  useEffect(() => {
    if (!user) {
      router.push('/')
    } else {
      fetchProfile()
      if (isAdmin) {
        fetchAllProfiles()
      }
    }
  }, [user])

  const fetchProfile = async () => {
    if (user) {
      const docRef = doc(db, 'users', user.uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile)
      }
    }
  }


  const fetchAllProfiles = async () => {
    const q = query(collection(db, 'users'))
    const querySnapshot = await getDocs(q)
    const profiles: { [key: string]: UserProfile } = {}
    querySnapshot.forEach((doc) => {
      profiles[doc.id] = doc.data() as UserProfile
    })
    setAllProfiles(profiles)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  const handleChildInputChange = (index: number, field: 'name' | 'grade', value: string) => {
    setProfile(prev => {
      const newChildren = [...prev.children]
      newChildren[index] = { ...newChildren[index], [field]: value }
      return { ...prev, children: newChildren }
    })
  }

  const addChild = () => {
    setProfile(prev => ({
      ...prev,
      children: [...prev.children, { name: '', grade: '' }]
    }))
  }

  const removeChild = (index: number) => {
    setProfile(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index)
    }))
  }

  const saveProfile = async () => {
    if (user) {
      await setDoc(doc(db, 'users', user.uid), profile)
      alert('Profile saved successfully!')
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      <div className="mb-4">
        <label className="block mb-2">Name:</label>
        <input
          type="text"
          name="name"
          value={profile.name}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2">Phone Number:</label>
        <input
          type="tel"
          name="phoneNumber"
          value={profile.phoneNumber}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Children</h2>
        {profile.children.map((child, index) => (
          <div key={index} className="mb-4 p-4 border rounded">
            <div className="mb-2">
              <label className="block mb-1">Child Name:</label>
              <input
                type="text"
                value={child.name}
                onChange={(e) => handleChildInputChange(index, 'name', e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-2">
              <label className="block mb-1">Child Grade:</label>
              <input
                type="text"
                value={child.grade}
                onChange={(e) => handleChildInputChange(index, 'grade', e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <button
              onClick={() => removeChild(index)}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Remove Child
            </button>
          </div>
        ))}
        <button
          onClick={addChild}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Add Child
        </button>
      </div>
      <button
        onClick={saveProfile}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Save Profile
      </button>

      {isAdmin && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">All User Profiles (Admin View)</h2>
          {Object.entries(allProfiles).map(([userId, profile]) => (
            <div key={userId} className="mb-4 p-4 border rounded">
              <h3 className="text-xl font-bold mb-2">{profile.name}</h3>
              <p>Phone: {profile.phoneNumber}</p>
              <h4 className="text-lg font-bold mt-2 mb-1">Children:</h4>
              <ul>
                {profile.children.map((child, index) => (
                  <li key={index}>
                    {child.name} - Grade: {child.grade}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
