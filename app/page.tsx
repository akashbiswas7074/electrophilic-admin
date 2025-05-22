import { redirect } from 'next/navigation'
 
export default function Home() {
  // Redirect to the public home page in the (public) route group
  redirect('/admin/login')
}
