import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
 
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-500 p-4 rounded-full">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="h-8 w-8 text-white"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Welcome to Electrophilic</CardTitle>
            <CardDescription>
              Access your dashboard to manage products, orders, and more
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 pb-6">
            <div className="grid grid-cols-1 gap-4">
              <Link href="/admin/login" className="w-full">
                <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                  Admin Login
                </Button>
              </Link>
              
              <Link href="/vendor/signin" className="w-full">
                <Button variant="outline" className="w-full border-blue-300 hover:bg-blue-50" size="lg">
                  Vendor Login
                </Button>
              </Link>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-center border-t pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-500">New vendor?</p>
              <Link href="/vendor/signup">
                <Button variant="link" className="text-blue-600">
                  Register as a Vendor
                </Button>
              </Link>
            </div>
          </CardFooter>
        </Card>
        
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Secure portal access • Admin and Vendor only</p>
          <p className="mt-1">&copy; {new Date().getFullYear()} Electrophilic. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
