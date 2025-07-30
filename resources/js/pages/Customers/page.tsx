"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  MapPin,
  CheckCircle,
  Clock,
  ArrowRight,
  Plus,
  Pencil,
  Trash,
  XCircle,
  MessageSquare,
  DollarSign,
  FileText,
  Star,
  Building,
  Home,
  Wifi,
  Phone,
  Package,
  ArrowLeft,
  Calculator,
} from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"

// Dynamically import the map component to avoid SSR issues
const LocationMap = dynamic(() => import("@/components/location-map"), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>,
})

interface AuthState {
  phone: string
  authenticated: boolean
}

interface ServiceDetails {
  serviceType: "voice" | "internet" | "combo"
  requestType: "new" | "upgrade" | "downgrade"
  internetBandwidth?: 1 | 3 | 5 | 10 | 20
}

interface SurveyFormData {
  name: string
  address: string
  latitude: number
  longitude: number
  phoneNumber: string
  additionalNotes: string
  customerType: "residential" | "enterprise"
  serviceDetails: ServiceDetails
}

interface PricingField {
  id: string
  name: string
  amount: number
  description?: string
  timeBasedRates?: boolean
}

interface PricingBreakdown {
  fields?: PricingField[]
  customFields?: PricingField[]
  laborCost: number
  wiringCost: number
  serviceFee: number
  miscellaneous: number
  subtotal: number
  vat: number
  totalFee: number
}

interface SurveyRequest {
  id: string
  transactionNumber: string
  name: string
  address: string
  latitude: number
  longitude: number
  phoneNumber: string
  additionalNotes: string
  customerType: "residential" | "enterprise"
  serviceDetails: ServiceDetails
  status: "Waiting" | "Completed" | "Cancelled" | "Approved"
  createdAt: string
  adminFeedback?: string
  customerFeedback?: string
  pricingBreakdown?: PricingBreakdown
  approvedByCustomer?: boolean
}

interface ServiceRequest {
  id: string
  surveyReference: string
  customerType: "residential" | "enterprise"
  status: "Pending" | "Quoted" | "Paid" | "Completed" | "Rejected"
  pricing?: {
    monthlyFee: number
    setupFee: number
    services: string[]
    totalPrice: number
    description: string
  }
  createdAt: string
  adminFeedback?: string
  customerFeedback?: string
  customerReview?: {
    rating: number
    comment: string
    submittedAt: string
  }
}

const validateEthiopianPhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[\s-]/g, "")
  const patterns = [
    /^\+251[79]\d{8}$/, // International format
    /^0[79]\d{8}$/, // National format with leading zero
    /^[79]\d{8}$/, // Without leading zero
  ]
  return patterns.some((pattern) => pattern.test(cleanPhone))
}

export default function PortalPage() {
  const [auth, setAuth] = useState<AuthState | null>(null)
  const [surveyRequests, setSurveyRequests] = useState<SurveyRequest[]>([])
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [customerFeedback, setCustomerFeedback] = useState("")
  const [showFeedbackModal, setShowFeedbackModal] = useState<{ type: "survey" | "service"; id: string } | null>(null)
  const [showPricingModal, setShowPricingModal] = useState<SurveyRequest | null>(null)
  const [formData, setFormData] = useState<SurveyFormData>({
    name: "",
    address: "",
    latitude: 0,
    longitude: 0,
    phoneNumber: "",
    additionalNotes: "",
    customerType: "residential",
    serviceDetails: {
      serviceType: "internet",
      requestType: "new",
      internetBandwidth: 5,
    },
  })
  const router = useRouter()

  useEffect(() => {
    const authData = localStorage.getItem("auth")
    if (!authData) {
      router.push("/auth/login")
      return
    }

    const parsedAuth = JSON.parse(authData)
    setAuth(parsedAuth)
    setFormData((prev) => ({ ...prev, phoneNumber: parsedAuth.phone }))

    // Load existing survey requests for current user only
    const savedSurveyRequests = localStorage.getItem("surveyRequests")
    const savedServiceRequests = localStorage.getItem("serviceRequests")

    if (savedSurveyRequests) {
      const allSurveys = JSON.parse(savedSurveyRequests)
      const userSurveys = allSurveys.filter((survey: SurveyRequest) => survey.phoneNumber === parsedAuth.phone)
      setSurveyRequests(userSurveys)
    }

    if (savedServiceRequests) {
      const allServices = JSON.parse(savedServiceRequests)
      // Filter service requests by matching survey references
      const userServices = allServices.filter((service: ServiceRequest) => {
        const allSurveys = JSON.parse(localStorage.getItem("surveyRequests") || "[]")
        const userSurvey = allSurveys.find(
          (survey: SurveyRequest) =>
            survey.phoneNumber === parsedAuth.phone && survey.transactionNumber === service.surveyReference,
        )
        return userSurvey
      })
      setServiceRequests(userServices)
    }
  }, [router])

  const canCreateNewSurvey = () => {
    const waitingOrCompletedSurveys = surveyRequests.filter(
      (survey) => survey.status === "Waiting" || survey.status === "Completed" || survey.status === "Approved",
    )
    return waitingOrCompletedSurveys.length === 0
  }

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address: address || prev.address,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validate Ethiopian phone number
    if (!validateEthiopianPhone(formData.phoneNumber)) {
      setError("Please enter a valid Ethiopian phone number")
      setLoading(false)
      return
    }

    if (!formData.latitude || !formData.longitude) {
      setError("Please select a location on the map")
      setLoading(false)
      return
    }

    // Check if user can create new survey
    if (!editingId && !canCreateNewSurvey()) {
      setError("You cannot create a new survey while you have an active survey")
      setLoading(false)
      return
    }

    // Simulate API call
    setTimeout(() => {
      const transactionNumber = `SUR${Date.now()}`
      const surveyRequest: SurveyRequest = {
        id: editingId || Date.now().toString(),
        transactionNumber: editingId
          ? surveyRequests.find((r) => r.id === editingId)?.transactionNumber || transactionNumber
          : transactionNumber,
        status: "Waiting",
        createdAt: editingId
          ? surveyRequests.find((r) => r.id === editingId)?.createdAt || new Date().toISOString()
          : new Date().toISOString(),
        ...formData,
      }

      // Load all surveys, update/add current user's survey, then save back
      let allSurveys = JSON.parse(localStorage.getItem("surveyRequests") || "[]")

      if (editingId) {
        allSurveys = allSurveys.map((req: SurveyRequest) => (req.id === editingId ? surveyRequest : req))
      } else {
        allSurveys.push(surveyRequest)
      }

      localStorage.setItem("surveyRequests", JSON.stringify(allSurveys))

      // Update local state with user's surveys only
      const userSurveys = allSurveys.filter((survey: SurveyRequest) => survey.phoneNumber === formData.phoneNumber)
      setSurveyRequests(userSurveys)

      setLoading(false)
      setSuccess(true)
      setShowForm(false)
      setEditingId(null)

      // Reset form after success
      setTimeout(() => {
        setSuccess(false)
        setFormData({
          name: "",
          address: "",
          latitude: 0,
          longitude: 0,
          phoneNumber: formData.phoneNumber,
          additionalNotes: "",
          customerType: "residential",
          serviceDetails: {
            serviceType: "internet",
            requestType: "new",
            internetBandwidth: 5,
          },
        })
      }, 2000)
    }, 1000)
  }

  const handleEdit = (survey: SurveyRequest) => {
    if (survey.status !== "Waiting") {
      setError("You can only edit surveys with 'Waiting' status")
      return
    }

    setFormData({
      name: survey.name,
      address: survey.address,
      latitude: survey.latitude,
      longitude: survey.longitude,
      phoneNumber: survey.phoneNumber,
      additionalNotes: survey.additionalNotes || "",
      customerType: survey.customerType,
      serviceDetails: survey.serviceDetails,
    })
    setEditingId(survey.id)
    setShowForm(true)
    setError("")
  }

  const handleDelete = (id: string) => {
    const survey = surveyRequests.find((r) => r.id === id)
    if (survey?.status !== "Waiting") {
      setError("You can only delete surveys with 'Waiting' status")
      return
    }

    const confirmed = window.confirm("Are you sure you want to delete this survey request?")
    if (confirmed) {
      let allSurveys = JSON.parse(localStorage.getItem("surveyRequests") || "[]")
      allSurveys = allSurveys.filter((req: SurveyRequest) => req.id !== id)
      localStorage.setItem("surveyRequests", JSON.stringify(allSurveys))

      const updatedRequests = surveyRequests.filter((req) => req.id !== id)
      setSurveyRequests(updatedRequests)
      setError("")
    }
  }

  const handleCancel = (id: string) => {
    const survey = surveyRequests.find((r) => r.id === id)
    if (survey?.status !== "Waiting") {
      setError("You can only cancel surveys with 'Waiting' status")
      return
    }

    const confirmed = window.confirm("Are you sure you want to cancel this survey request?")
    if (confirmed) {
      let allSurveys = JSON.parse(localStorage.getItem("surveyRequests") || "[]")
      allSurveys = allSurveys.map((req: SurveyRequest) =>
        req.id === id ? { ...req, status: "Cancelled" as const } : req,
      )
      localStorage.setItem("surveyRequests", JSON.stringify(allSurveys))

      const updatedRequests = surveyRequests.map((req) =>
        req.id === id ? { ...req, status: "Cancelled" as const } : req,
      )
      setSurveyRequests(updatedRequests)
    }
  }

  const submitCustomerFeedback = (type: "survey" | "service", id: string) => {
    if (type === "survey") {
      let allSurveys = JSON.parse(localStorage.getItem("surveyRequests") || "[]")
      allSurveys = allSurveys.map((req: SurveyRequest) => (req.id === id ? { ...req, customerFeedback } : req))
      localStorage.setItem("surveyRequests", JSON.stringify(allSurveys))

      const updatedRequests = surveyRequests.map((req) => (req.id === id ? { ...req, customerFeedback } : req))
      setSurveyRequests(updatedRequests)
    } else {
      let allServices = JSON.parse(localStorage.getItem("serviceRequests") || "[]")
      allServices = allServices.map((req: ServiceRequest) => (req.id === id ? { ...req, customerFeedback } : req))
      localStorage.setItem("serviceRequests", JSON.stringify(allServices))

      const updatedRequests = serviceRequests.map((req) => (req.id === id ? { ...req, customerFeedback } : req))
      setServiceRequests(updatedRequests)
    }

    setCustomerFeedback("")
    setShowFeedbackModal(null)
  }

  const approvePricing = (surveyId: string) => {
    let allSurveys = JSON.parse(localStorage.getItem("surveyRequests") || "[]")
    allSurveys = allSurveys.map((req: SurveyRequest) =>
      req.id === surveyId ? { ...req, approvedByCustomer: true, status: "Approved" as const } : req,
    )
    localStorage.setItem("surveyRequests", JSON.stringify(allSurveys))

    const updatedRequests = surveyRequests.map((req) =>
      req.id === surveyId ? { ...req, approvedByCustomer: true, status: "Approved" as const } : req,
    )
    setSurveyRequests(updatedRequests)
    setShowPricingModal(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Waiting":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Waiting
          </Badge>
        )
      case "Completed":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed - Review Pricing
          </Badge>
        )
      case "Approved":
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )
      case "Cancelled":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        )
      case "Pending":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "Quoted":
        return (
          <Badge variant="outline">
            <DollarSign className="w-3 h-3 mr-1" />
            Quoted
          </Badge>
        )
      case "Paid":
        return (
          <Badge variant="default">
            <DollarSign className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        )
      case "Rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case "voice":
        return <Phone className="w-4 h-4" />
      case "internet":
        return <Wifi className="w-4 h-4" />
      case "combo":
        return <Package className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  if (!auth) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Customer Portal</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {auth.phone}</span>
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.removeItem("auth")
                  router.push("/")
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {error && (
            <Alert className="mb-6" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6">
              <CheckCircle className="w-4 h-4 mr-2" />
              <AlertDescription>Survey request submitted successfully!</AlertDescription>
            </Alert>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Survey Management Section */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Survey Requests</h2>
                <Button
                  onClick={() => {
                    if (!canCreateNewSurvey()) {
                      setError(
                        "You cannot create a new survey while you have a Waiting, Completed, or Approved survey. Please delete your Waiting survey first or wait for it to be processed.",
                      )
                      return
                    }
                    setShowForm(!showForm)
                    setEditingId(null)
                    setError("")
                  }}
                  disabled={!canCreateNewSurvey()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {showForm ? (
                    "Hide Form"
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" /> New Survey
                    </>
                  )}
                </Button>
              </div>

              {!canCreateNewSurvey() && (
                <Alert className="mb-6">
                  <AlertDescription>
                    You can only have one active survey at a time. You currently have a survey that is either Waiting
                    for review, Completed, or Approved.
                    {surveyRequests.some((s) => s.status === "Waiting") &&
                      " You can delete your Waiting survey to create a new one."}
                  </AlertDescription>
                </Alert>
              )}

              {/* Survey List */}
              <div className="space-y-4">
                {surveyRequests.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">No survey requests yet</p>
                      <p className="text-sm text-gray-500">Use the "New Survey" button above to get started</p>
                    </CardContent>
                  </Card>
                ) : (
                  surveyRequests.map((request) => (
                    <Card key={request.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-gray-500" />
                            <div>
                              <h3 className="font-semibold">#{request.transactionNumber}</h3>
                              <p className="text-xs text-gray-500">
                                Created: {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div>{getStatusBadge(request.status)}</div>
                        </div>
                        <div className="p-4">
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium">Name</p>
                              <p className="text-sm text-gray-600">{request.name}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Customer Type</p>
                              <Badge variant={request.customerType === "enterprise" ? "default" : "secondary"}>
                                {request.customerType === "enterprise" ? (
                                  <Building className="w-3 h-3 mr-1" />
                                ) : (
                                  <Home className="w-3 h-3 mr-1" />
                                )}
                                {request.customerType}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Service Type</p>
                              <div className="flex items-center gap-1">
                                {getServiceIcon(request.serviceDetails.serviceType)}
                                <span className="text-sm text-gray-600 capitalize">
                                  {request.serviceDetails.serviceType}
                                  {request.serviceDetails.serviceType === "internet" &&
                                    ` (${request.serviceDetails.internetBandwidth}Mbps)`}
                                </span>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Request Type</p>
                              <p className="text-sm text-gray-600 capitalize">{request.serviceDetails.requestType}</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <p className="text-sm font-medium">Address</p>
                            <p className="text-sm text-gray-600">{request.address}</p>
                          </div>

                          {request.adminFeedback && (
                            <div className="mb-4">
                              <p className="text-sm font-medium">Admin Feedback</p>
                              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{request.adminFeedback}</p>
                            </div>
                          )}

                          {request.customerFeedback && (
                            <div className="mb-4">
                              <p className="text-sm font-medium">Your Feedback</p>
                              <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded">{request.customerFeedback}</p>
                            </div>
                          )}

                          <div className="flex justify-end gap-2 pt-2 border-t">
                            {request.status === "Waiting" && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => handleEdit(request)}>
                                  <Pencil className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleCancel(request.id)}>
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Cancel
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(request.id)}>
                                  <Trash className="w-3 h-3 mr-1" />
                                  Delete
                                </Button>
                              </>
                            )}

                            {request.status === "Completed" && request.pricingBreakdown && (
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => setShowPricingModal(request)}
                              >
                                <DollarSign className="w-3 h-3 mr-1" />
                                Review Pricing
                              </Button>
                            )}

                            {(request.status === "Completed" || request.status === "Cancelled") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowFeedbackModal({ type: "survey", id: request.id })}
                              >
                                <MessageSquare className="w-3 h-3 mr-1" />
                                Add Feedback
                              </Button>
                            )}

                            {request.status === "Approved" && (
                              <Link href={`/portal/service-request?survey=${request.transactionNumber}`}>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                  Continue to Service Request
                                  <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Service Requests Section */}
              {serviceRequests.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-6">Your Service Requests</h2>
                  <div className="space-y-4">
                    {serviceRequests.map((request) => (
                      <Card key={request.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-gray-500" />
                              <div>
                                <h3 className="font-semibold">Survey: #{request.surveyReference}</h3>
                                <p className="text-xs text-gray-500">
                                  Created: {new Date(request.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div>{getStatusBadge(request.status)}</div>
                          </div>
                          <div className="p-4">
                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-sm font-medium">Customer Type</p>
                                <p className="text-sm text-gray-600 capitalize">{request.customerType}</p>
                              </div>
                              {request.pricing && (
                                <div>
                                  <p className="text-sm font-medium">Pricing</p>
                                  <p className="text-sm text-gray-600">
                                    Monthly: ETB {request.pricing.monthlyFee} | Setup: ETB {request.pricing.setupFee}
                                  </p>
                                </div>
                              )}
                            </div>

                            {request.pricing && (
                              <div className="mb-4">
                                <p className="text-sm font-medium">Services</p>
                                <p className="text-sm text-gray-600">{request.pricing.services.join(", ")}</p>
                                <div className="mt-3 pt-2 border-t">
                                  <div className="flex justify-between items-center">
                                    <p className="text-sm font-medium">Total Price:</p>
                                    <p className="text-sm font-bold">ETB {request.pricing.totalPrice}</p>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1 bg-blue-50 p-2 rounded">
                                    {request.pricing.description}
                                  </p>
                                </div>
                              </div>
                            )}

                            {request.adminFeedback && (
                              <div className="mb-4">
                                <p className="text-sm font-medium">Admin Feedback</p>
                                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{request.adminFeedback}</p>
                              </div>
                            )}

                            {request.customerFeedback && (
                              <div className="mb-4">
                                <p className="text-sm font-medium">Your Feedback</p>
                                <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                                  {request.customerFeedback}
                                </p>
                              </div>
                            )}

                            {request.customerReview && (
                              <div className="mb-4">
                                <p className="text-sm font-medium">Your Review</p>
                                <div className="bg-yellow-50 p-2 rounded">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`w-3 h-3 ${
                                            star <= request.customerReview!.rating
                                              ? "text-yellow-400 fill-current"
                                              : "text-gray-300"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-xs text-gray-600">({request.customerReview.rating}/5)</span>
                                  </div>
                                  <p className="text-sm text-gray-600">{request.customerReview.comment}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Reviewed: {new Date(request.customerReview.submittedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2 border-t">
                              {request.status === "Quoted" && request.pricing && (
                                <Link href="/portal/payment">
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                    Pay ETB {request.pricing.totalPrice}
                                    <ArrowRight className="w-3 h-3 ml-1" />
                                  </Button>
                                </Link>
                              )}

                              {request.status === "Completed" && (
                                <Link href={`/portal/service-request/review?service=${request.id}`}>
                                  <Button size="sm" variant="outline">
                                    <Star className="w-3 h-3 mr-1" />
                                    {request.customerReview ? "Update Review" : "Rate Service"}
                                  </Button>
                                </Link>
                              )}

                              {(request.status === "Completed" || request.status === "Rejected") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowFeedbackModal({ type: "service", id: request.id })}
                                >
                                  <MessageSquare className="w-3 h-3 mr-1" />
                                  Add Feedback
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Survey Form Section */}
            <div>
              {showForm && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      {editingId ? "Edit Survey Request" : "New Survey Request"}
                    </CardTitle>
                    <CardDescription>
                      Please provide your location details and service requirements to check availability in your area
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Ethiopian Phone Number *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                            placeholder="+251911234567 or 0911234567"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="customerType">Customer Type *</Label>
                          <div className="grid grid-cols-2 gap-4">
                            <div
                              className={`border rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer transition-all ${
                                formData.customerType === "residential"
                                  ? "bg-green-50 border-green-500 shadow-sm"
                                  : "hover:bg-gray-50"
                              }`}
                              onClick={() => setFormData((prev) => ({ ...prev, customerType: "residential" }))}
                            >
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                  formData.customerType === "residential" ? "bg-green-100" : "bg-gray-100"
                                }`}
                              >
                                <Home
                                  className={`w-6 h-6 ${formData.customerType === "residential" ? "text-green-600" : "text-gray-600"}`}
                                />
                              </div>
                              <span className="font-medium">Residential</span>
                              <span className="text-xs text-gray-500 text-center">For home and personal use</span>
                              <input
                                type="radio"
                                id="residential"
                                name="customerType"
                                value="residential"
                                checked={formData.customerType === "residential"}
                                onChange={() => {}}
                                className="sr-only"
                              />
                            </div>
                            <div
                              className={`border rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer transition-all ${
                                formData.customerType === "enterprise"
                                  ? "bg-blue-50 border-blue-500 shadow-sm"
                                  : "hover:bg-gray-50"
                              }`}
                              onClick={() => setFormData((prev) => ({ ...prev, customerType: "enterprise" }))}
                            >
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                  formData.customerType === "enterprise" ? "bg-blue-100" : "bg-gray-100"
                                }`}
                              >
                                <Building
                                  className={`w-6 h-6 ${formData.customerType === "enterprise" ? "text-blue-600" : "text-gray-600"}`}
                                />
                              </div>
                              <span className="font-medium">Enterprise</span>
                              <span className="text-xs text-gray-500 text-center">For business and organizations</span>
                              <input
                                type="radio"
                                id="enterprise"
                                name="customerType"
                                value="enterprise"
                                checked={formData.customerType === "enterprise"}
                                onChange={() => {}}
                                className="sr-only"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6 p-6 border rounded-lg bg-gradient-to-br from-gray-50 to-white">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-600" />
                            Service Details
                          </h3>

                          <div className="space-y-4">
                            <Label htmlFor="serviceType" className="text-base">
                              Service Type *
                            </Label>
                            <div className="grid grid-cols-3 gap-4">
                              <div
                                className={`border rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer transition-all ${
                                  formData.serviceDetails.serviceType === "voice"
                                    ? "bg-purple-50 border-purple-500 shadow-sm"
                                    : "hover:bg-gray-50"
                                }`}
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    serviceDetails: { ...prev.serviceDetails, serviceType: "voice" },
                                  }))
                                }
                              >
                                <div
                                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                    formData.serviceDetails.serviceType === "voice" ? "bg-purple-100" : "bg-gray-100"
                                  }`}
                                >
                                  <Phone
                                    className={`w-6 h-6 ${formData.serviceDetails.serviceType === "voice" ? "text-purple-600" : "text-gray-600"}`}
                                  />
                                </div>
                                <span className="font-medium">Fixed Voice Line</span>
                                <span className="text-xs text-gray-500 text-center">Traditional phone service</span>
                                <input
                                  type="radio"
                                  id="voice"
                                  name="serviceType"
                                  value="voice"
                                  checked={formData.serviceDetails.serviceType === "voice"}
                                  onChange={() => {}}
                                  className="sr-only"
                                />
                              </div>

                              <div
                                className={`border rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer transition-all ${
                                  formData.serviceDetails.serviceType === "internet"
                                    ? "bg-blue-50 border-blue-500 shadow-sm"
                                    : "hover:bg-gray-50"
                                }`}
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    serviceDetails: { ...prev.serviceDetails, serviceType: "internet" },
                                  }))
                                }
                              >
                                <div
                                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                    formData.serviceDetails.serviceType === "internet" ? "bg-blue-100" : "bg-gray-100"
                                  }`}
                                >
                                  <Wifi
                                    className={`w-6 h-6 ${formData.serviceDetails.serviceType === "internet" ? "text-blue-600" : "text-gray-600"}`}
                                  />
                                </div>
                                <span className="font-medium">Internet</span>
                                <span className="text-xs text-gray-500 text-center">High-speed internet access</span>
                                <input
                                  type="radio"
                                  id="internet"
                                  name="serviceType"
                                  value="internet"
                                  checked={formData.serviceDetails.serviceType === "internet"}
                                  onChange={() => {}}
                                  className="sr-only"
                                />
                              </div>

                              <div
                                className={`border rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer transition-all ${
                                  formData.serviceDetails.serviceType === "combo"
                                    ? "bg-green-50 border-green-500 shadow-sm"
                                    : "hover:bg-gray-50"
                                }`}
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    serviceDetails: { ...prev.serviceDetails, serviceType: "combo" },
                                  }))
                                }
                              >
                                <div
                                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                    formData.serviceDetails.serviceType === "combo" ? "bg-green-100" : "bg-gray-100"
                                  }`}
                                >
                                  <Package
                                    className={`w-6 h-6 ${formData.serviceDetails.serviceType === "combo" ? "text-green-600" : "text-gray-600"}`}
                                  />
                                </div>
                                <span className="font-medium">Combo</span>
                                <span className="text-xs text-gray-500 text-center">Voice + Internet bundle</span>
                                <input
                                  type="radio"
                                  id="combo"
                                  name="serviceType"
                                  value="combo"
                                  checked={formData.serviceDetails.serviceType === "combo"}
                                  onChange={() => {}}
                                  className="sr-only"
                                />
                              </div>
                            </div>
                          </div>

                          {(formData.serviceDetails.serviceType === "internet" ||
                            formData.serviceDetails.serviceType === "combo") && (
                            <div className="space-y-4">
                              <Label htmlFor="bandwidth" className="text-base">
                                Internet Bandwidth *
                              </Label>
                              <div className="grid grid-cols-5 gap-2">
                                {[1, 3, 5, 10, 20].map((speed) => (
                                  <div
                                    key={speed}
                                    className={`border rounded-lg p-3 flex flex-col items-center cursor-pointer transition-all ${
                                      formData.serviceDetails.internetBandwidth === speed
                                        ? "bg-blue-50 border-blue-500 shadow-sm"
                                        : "hover:bg-gray-50"
                                    }`}
                                    onClick={() =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        serviceDetails: {
                                          ...prev.serviceDetails,
                                          internetBandwidth: speed as 1 | 3 | 5 | 10 | 20,
                                        },
                                      }))
                                    }
                                  >
                                    <span className="text-lg font-bold">{speed}</span>
                                    <span className="text-xs">Mbps</span>
                                  </div>
                                ))}
                              </div>
                              <div className="h-2 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-600 rounded-full mt-2"></div>
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>Basic</span>
                                <span>Standard</span>
                                <span>Premium</span>
                              </div>
                            </div>
                          )}

                          <div className="space-y-4">
                            <Label htmlFor="requestType" className="text-base">
                              Request Type *
                            </Label>
                            <div className="grid grid-cols-3 gap-4">
                              <div
                                className={`border rounded-lg p-3 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                                  formData.serviceDetails.requestType === "new"
                                    ? "bg-green-50 border-green-500 shadow-sm"
                                    : "hover:bg-gray-50"
                                }`}
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    serviceDetails: { ...prev.serviceDetails, requestType: "new" },
                                  }))
                                }
                              >
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    formData.serviceDetails.requestType === "new" ? "bg-green-100" : "bg-gray-100"
                                  }`}
                                >
                                  <Plus
                                    className={`w-4 h-4 ${formData.serviceDetails.requestType === "new" ? "text-green-600" : "text-gray-600"}`}
                                  />
                                </div>
                                <span className="font-medium">New</span>
                                <span className="text-xs text-gray-500">First-time setup</span>
                                <input
                                  type="radio"
                                  id="new"
                                  name="requestType"
                                  value="new"
                                  checked={formData.serviceDetails.requestType === "new"}
                                  onChange={() => {}}
                                  className="sr-only"
                                />
                              </div>

                              <div
                                className={`border rounded-lg p-3 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                                  formData.serviceDetails.requestType === "upgrade"
                                    ? "bg-blue-50 border-blue-500 shadow-sm"
                                    : "hover:bg-gray-50"
                                }`}
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    serviceDetails: { ...prev.serviceDetails, requestType: "upgrade" },
                                  }))
                                }
                              >
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    formData.serviceDetails.requestType === "upgrade" ? "bg-blue-100" : "bg-gray-100"
                                  }`}
                                >
                                  <ArrowRight
                                    className={`w-4 h-4 ${formData.serviceDetails.requestType === "upgrade" ? "text-blue-600" : "text-gray-600"}`}
                                  />
                                </div>
                                <span className="font-medium">Upgrade</span>
                                <span className="text-xs text-gray-500">Improve service</span>
                                <input
                                  type="radio"
                                  id="upgrade"
                                  name="requestType"
                                  value="upgrade"
                                  checked={formData.serviceDetails.requestType === "upgrade"}
                                  onChange={() => {}}
                                  className="sr-only"
                                />
                              </div>

                              <div
                                className={`border rounded-lg p-3 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                                  formData.serviceDetails.requestType === "downgrade"
                                    ? "bg-orange-50 border-orange-500 shadow-sm"
                                    : "hover:bg-gray-50"
                                }`}
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    serviceDetails: { ...prev.serviceDetails, requestType: "downgrade" },
                                  }))
                                }
                              >
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    formData.serviceDetails.requestType === "downgrade"
                                      ? "bg-orange-100"
                                      : "bg-gray-100"
                                  }`}
                                >
                                  <ArrowLeft
                                    className={`w-4 h-4 ${formData.serviceDetails.requestType === "downgrade" ? "text-orange-600" : "text-gray-600"}`}
                                  />
                                </div>
                                <span className="font-medium">Downgrade</span>
                                <span className="text-xs text-gray-500">Reduce service</span>
                                <input
                                  type="radio"
                                  id="downgrade"
                                  name="requestType"
                                  value="downgrade"
                                  checked={formData.serviceDetails.requestType === "downgrade"}
                                  onChange={() => {}}
                                  className="sr-only"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="address">Address *</Label>
                          <Textarea
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                            placeholder="Enter your complete address"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="latitude">Latitude</Label>
                            <Input
                              id="latitude"
                              type="number"
                              step="any"
                              value={formData.latitude || ""}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, latitude: Number.parseFloat(e.target.value) || 0 }))
                              }
                              placeholder="9.000000"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="longitude">Longitude</Label>
                            <Input
                              id="longitude"
                              type="number"
                              step="any"
                              value={formData.longitude || ""}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, longitude: Number.parseFloat(e.target.value) || 0 }))
                              }
                              placeholder="38.000000"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-base font-semibold">Select Location on Map *</Label>
                          <p className="text-sm text-gray-600 mb-4">Click on the map to select your exact location.</p>
                          <LocationMap
                            onLocationSelect={handleLocationSelect}
                            initialLat={formData.latitude || 9.0192}
                            initialLng={formData.longitude || 38.7525}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes">Additional Notes</Label>
                          <Textarea
                            id="notes"
                            value={formData.additionalNotes}
                            onChange={(e) => setFormData((prev) => ({ ...prev, additionalNotes: e.target.value }))}
                            placeholder="Any additional information"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-4 pt-6 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowForm(false)
                            setEditingId(null)
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                          {loading ? "Submitting..." : editingId ? "Update Survey" : "Submit Survey"}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Review Modal */}
      {showPricingModal && showPricingModal.pricingBreakdown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-lg w-full">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                Review Pricing Details
              </CardTitle>
              <CardDescription>Survey: #{showPricingModal.transactionNumber}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Dynamic pricing fields */}
              <div className="space-y-3">
                {showPricingModal.pricingBreakdown.fields?.map((field) => (
                  <div key={field.id} className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium">{field.name}</span>
                      {field.description && <p className="text-xs text-gray-500">{field.description}</p>}
                      {field.timeBasedRates && (
                        <span className="text-xs text-blue-600 font-medium">
                          {(() => {
                            const currentHour = new Date().getHours()
                            const isWeekend = [0, 6].includes(new Date().getDay())
                            if (isWeekend) return "Weekend Rate Applied (+20%)"
                            if (currentHour >= 9 && currentHour <= 17) return "Peak Hour Rate Applied (+10%)"
                            if (currentHour < 6 || currentHour > 22) return "Off-Peak Rate Applied (-10%)"
                            return "Standard Rate Applied"
                          })()}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium">ETB {field.amount}</span>
                  </div>
                ))}

                {/* Custom fields section */}
                {showPricingModal.pricingBreakdown.customFields && (
                  <div className="pt-2 mt-2 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold">Additional Services</h4>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        <Plus className="w-3 h-3 mr-1" />
                        Add Service
                      </Button>
                    </div>

                    {showPricingModal.pricingBreakdown.customFields.map((field) => (
                      <div key={field.id} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`custom-${field.id}`}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <label htmlFor={`custom-${field.id}`} className="text-sm font-medium cursor-pointer">
                              {field.name}
                            </label>
                            {field.description && <p className="text-xs text-gray-500">{field.description}</p>}
                          </div>
                        </div>
                        <span className="text-sm font-medium">ETB {field.amount}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm">Subtotal:</span>
                  <span className="text-sm font-medium">ETB {showPricingModal.pricingBreakdown.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">VAT (15%):</span>
                  <span className="text-sm font-medium">ETB {showPricingModal.pricingBreakdown.vat}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>Total Fee:</span>
                  <span>ETB {showPricingModal.pricingBreakdown.totalFee}</span>
                </div>
              </div>

              {/* Time-based pricing info */}
              <div className="bg-blue-50 p-3 rounded-lg text-xs text-gray-700">
                <p className="font-medium mb-1">Time-based pricing information:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div>• Standard Rate: 100%</div>
                  <div>• Peak Hours (9AM-5PM): +10%</div>
                  <div>• Off-Peak Hours (10PM-6AM): -10%</div>
                  <div>• Weekends: +20%</div>
                </div>
                <p className="mt-2 text-blue-600">
                  Current pricing reflects {(() => {
                    const currentHour = new Date().getHours()
                    const isWeekend = [0, 6].includes(new Date().getDay())
                    if (isWeekend) return "weekend rates"
                    if (currentHour >= 9 && currentHour <= 17) return "peak hour rates"
                    if (currentHour < 6 || currentHour > 22) return "off-peak rates"
                    return "standard rates"
                  })()}
                </p>
              </div>

              <Alert>
                <AlertDescription>
                  By approving this pricing, you agree to proceed with the service installation at the quoted price.
                  Prices are valid for 7 days from today.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  onClick={() => approvePricing(showPricingModal.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve & Continue
                </Button>
                <Button variant="outline" onClick={() => setShowPricingModal(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Customer Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Add Your Feedback</CardTitle>
              <CardDescription>
                Share your experience with this {showFeedbackModal.type === "survey" ? "survey" : "service request"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerFeedback">Your Feedback</Label>
                <Textarea
                  id="customerFeedback"
                  value={customerFeedback}
                  onChange={(e) => setCustomerFeedback(e.target.value)}
                  placeholder="Share your thoughts, suggestions, or concerns..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => submitCustomerFeedback(showFeedbackModal.type, showFeedbackModal.id)}
                  className="flex-1"
                  disabled={!customerFeedback.trim()}
                >
                  Submit Feedback
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowFeedbackModal(null)
                    setCustomerFeedback("")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
