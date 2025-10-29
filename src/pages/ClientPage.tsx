import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { brandColors } from '../stylings'
import { Layout } from '../components/layout'
import { useGlobalCurrency } from '../hooks/useGlobalCurrency'
import { supabase } from '../lib/supabaseClient'
import { saveClient } from '../lib/clientCheck'
import {
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Mail,
  Phone,
  MapPin,
  Building,
  AlertTriangle,
  Users,
  DollarSign,
  Calendar,
  MoreVertical,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { useLoading } from '../contexts/LoadingContext'

interface Client {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  company_name: string | null
  created_at: string
  updated_at: string
  overdue_count: number
}

interface ClientFormData {
  name: string
  email: string
  phone: string
  address: string
  company_name: string
}

export default function ClientPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { setLoading: setGlobalLoading } = useLoading()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showClientForm, setShowClientForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  // Form data
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    company_name: ''
  })

  // Responsive state management
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Load clients on mount
  useEffect(() => {
    if (user) {
      loadClients()
    }
  }, [user])

  const loadClients = async () => {
    if (!user) return

    try {
      setLoading(true)
      setGlobalLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading clients:', error)
        toast.error('Failed to load clients')
        return
      }

      setClients(data || [])
    } catch (error) {
      console.error('Error loading clients:', error)
      toast.error('Failed to load clients')
    } finally {
      setLoading(false)
      setGlobalLoading(false)
    }
  }

  const handleSaveClient = async () => {
    if (!user || !formData.name.trim()) {
      toast.error('Client name is required')
      return
    }

    try {
      setSaving(true)
      
      if (editingClient) {
        // Update existing client (direct update for editing mode)
        const { error } = await supabase
          .from('clients')
          .update({
            name: formData.name.trim(),
            email: formData.email.trim() || null,
            phone: formData.phone.trim() || null,
            address: formData.address.trim() || null,
            company_name: formData.company_name.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingClient.id)
          .eq('user_id', user.id)

        if (error) {
          console.error('Error updating client:', error)
          toast.error('Failed to update client')
          return
        }

        toast.success('Client updated successfully!')
      } else {
        // Create new client - check for duplicates first
        const clientResult = await saveClient({
            name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          company_name: formData.company_name.trim()
        }, user.id)

        if (!clientResult.success) {
          console.error('Error creating client:', clientResult.error)
          toast.error('Failed to create client: ' + (clientResult.error || 'Unknown error'))
          return
        }

        // Show appropriate success message
        if (clientResult.isNewClient) {
        toast.success('Client created successfully!')
        } else if (clientResult.isUpdated) {
          toast.success('Client updated successfully!')
        } else {
          toast.success('Client already exists!')
        }
      }

      // Reset form and reload clients
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        company_name: ''
      })
      setShowClientForm(false)
      setEditingClient(null)
      loadClients()
    } catch (error) {
      console.error('Error saving client:', error)
      toast.error('Failed to save client')
    } finally {
      setSaving(false)
    }
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      company_name: client.company_name || ''
    })
    setShowClientForm(true)
  }


  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      company_name: ''
    })
    setEditingClient(null)
    setShowClientForm(false)
  }

  // Filter clients based on search query
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate statistics
  const totalClients = clients.length
  const clientsWithOverdue = clients.filter(client => client.overdue_count > 0).length
  const totalOverdueCount = clients.reduce((sum, client) => sum + client.overdue_count, 0)

  if (loading) {
    return (
      <Layout hideBottomNav={true}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: `3px solid ${brandColors.primary[200]}`,
              borderTop: `3px solid ${brandColors.primary[600]}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{
              color: brandColors.neutral[600],
              fontSize: '0.875rem'
            }}>
              Loading clients...
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout hideBottomNav={true}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '1rem' : '1rem 2rem',
        backgroundColor: isMobile ? 'rgba(255, 255, 255, 0.7)' : 'white',
        backdropFilter: isMobile ? 'blur(10px)' : 'none',
        borderBottom: `1px solid ${isMobile ? 'rgba(0, 0, 0, 0.05)' : brandColors.neutral[200]}`,
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: isMobile ? '0.625rem' : '0.5rem',
            backgroundColor: isMobile ? brandColors.neutral[900] : brandColors.neutral[100],
            border: 'none',
            borderRadius: isMobile ? '10px' : '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: isMobile ? 'white' : brandColors.neutral[600],
            fontSize: '0.875rem',
            fontWeight: isMobile ? '600' : '500',
            boxShadow: isMobile ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <ArrowLeft size={isMobile ? 18 : 16} strokeWidth={isMobile ? 2.5 : 2} />
          {isMobile ? '' : 'Back'}
        </button>
        
        <h1 style={{
          fontSize: isMobile ? '1.125rem' : '1.25rem',
          fontWeight: '600',
          color: brandColors.neutral[900],
          margin: 0,
          textAlign: 'center',
          flex: 1
        }}>
          {isMobile ? 'Clients' : 'Client Management'}
        </h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {!isMobile && (
          <button
            onClick={() => setShowClientForm(true)}
            style={{
                padding: '0.5rem 1rem',
              backgroundColor: brandColors.primary[600],
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Plus size={16} />
            Add Client
          </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{
        padding: isMobile ? '1rem' : '2rem 2rem 1rem 2rem'
      }}>
        {/* Statistics - Modern Minimal Design */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
          gap: isMobile ? '0.75rem' : '1.25rem',
          marginBottom: '1.5rem'
        }}>
          {/* Total Clients */}
          <div style={{
            background: `linear-gradient(135deg, ${brandColors.primary[50]} 0%, ${brandColors.primary[100]} 100%)`,
            borderRadius: isMobile ? '16px' : '20px',
            padding: isMobile ? '1rem' : '1.5rem',
            border: `1px solid ${brandColors.primary[200]}`,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: brandColors.primary[200],
              opacity: 0.3
            }} />
            <Users 
              size={isMobile ? 18 : 24} 
              color={brandColors.primary[600]} 
              style={{ marginBottom: '0.5rem', position: 'relative', zIndex: 1 }} 
            />
            <p style={{
              fontSize: isMobile ? '1.75rem' : '2.25rem',
              fontWeight: '700',
              color: brandColors.primary[700],
              margin: '0 0 0.25rem 0',
              position: 'relative',
              zIndex: 1
            }}>
              {totalClients}
            </p>
            <p style={{
              fontSize: isMobile ? '0.7rem' : '0.875rem',
              fontWeight: '600',
              color: brandColors.primary[600],
              margin: 0,
              position: 'relative',
              zIndex: 1
            }}>
              Total Clients
            </p>
          </div>

          {/* Clients with Overdue */}
          <div style={{
            background: `linear-gradient(135deg, ${brandColors.error[50]} 0%, ${brandColors.error[100]} 100%)`,
            borderRadius: isMobile ? '16px' : '20px',
            padding: isMobile ? '1rem' : '1.5rem',
            border: `1px solid ${brandColors.error[200]}`,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: brandColors.error[200],
              opacity: 0.3
            }} />
            <AlertTriangle 
              size={isMobile ? 18 : 24} 
              color={brandColors.error[600]} 
              style={{ marginBottom: '0.5rem', position: 'relative', zIndex: 1 }} 
            />
            <p style={{
              fontSize: isMobile ? '1.75rem' : '2.25rem',
              fontWeight: '700',
              color: brandColors.error[700],
              margin: '0 0 0.25rem 0',
              position: 'relative',
              zIndex: 1
            }}>
              {clientsWithOverdue}
            </p>
            <p style={{
              fontSize: isMobile ? '0.7rem' : '0.875rem',
              fontWeight: '600',
              color: brandColors.error[600],
              margin: 0,
              position: 'relative',
              zIndex: 1
            }}>
              With Overdue
            </p>
          </div>

          {/* Total Overdue Count */}
          <div style={{
            background: `linear-gradient(135deg, ${brandColors.warning[50]} 0%, ${brandColors.warning[100]} 100%)`,
            borderRadius: isMobile ? '16px' : '20px',
            padding: isMobile ? '1rem' : '1.5rem',
            border: `1px solid ${brandColors.warning[200]}`,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: brandColors.warning[200],
              opacity: 0.3
            }} />
            <DollarSign 
              size={isMobile ? 18 : 24} 
              color={brandColors.warning[600]} 
              style={{ marginBottom: '0.5rem', position: 'relative', zIndex: 1 }} 
            />
            <p style={{
              fontSize: isMobile ? '1.75rem' : '2.25rem',
              fontWeight: '700',
              color: brandColors.warning[700],
              margin: '0 0 0.25rem 0',
              position: 'relative',
              zIndex: 1
            }}>
              {totalOverdueCount}
            </p>
            <p style={{
              fontSize: isMobile ? '0.7rem' : '0.875rem',
              fontWeight: '600',
              color: brandColors.warning[600],
              margin: 0,
              position: 'relative',
              zIndex: 1
            }}>
              Overdue Count
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{
          marginBottom: '2rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center'
        }}>
          <div style={{
            position: 'relative',
            flex: 1
          }}>
            <Search 
              size={20} 
              color={brandColors.neutral[400]} 
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              placeholder="Search clients by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 2.75rem',
                border: `1px solid ${brandColors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '0.875rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          {/* Mobile Add Button */}
          {isMobile && (
            <button
              onClick={() => setShowClientForm(true)}
              style={{
                padding: '0.75rem',
                backgroundColor: brandColors.primary[600],
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '48px',
                height: '48px',
                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.2)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = brandColors.primary[700]
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = brandColors.primary[600]
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(22, 163, 74, 0.2)'
              }}
            >
              <Plus size={20} />
            </button>
          )}
        </div>

        {/* Clients List - Transaction Style */}
        {filteredClients.length === 0 ? (
        <div style={{
            padding: '3rem',
            textAlign: 'center',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: `1px solid ${brandColors.neutral[100]}`
            }}>
              <Users size={48} color={brandColors.neutral[300]} style={{ marginBottom: '1rem' }} />
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: brandColors.neutral[700],
                margin: '0 0 0.5rem 0'
              }}>
                {searchQuery ? 'No clients found' : 'No clients yet'}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: brandColors.neutral[500],
                margin: '0 0 1.5rem 0'
              }}>
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Add your first client to get started'
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowClientForm(true)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: brandColors.primary[600],
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    margin: '0 auto'
                  }}
                >
                  <Plus size={16} />
                  Add First Client
                </button>
              )}
            </div>
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {filteredClients.map((client) => (
                <div
                  key={client.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: isMobile ? '0.875rem' : '1rem 1.25rem',
                  backgroundColor: brandColors.white,
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  border: `1px solid ${brandColors.neutral[100]}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => handleEditClient(client)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.08)'
                  e.currentTarget.style.borderColor = brandColors.neutral[200]
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)'
                  e.currentTarget.style.borderColor = brandColors.neutral[100]
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                  {/* Avatar Circle */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    minWidth: '36px',
                    borderRadius: '50%',
                    backgroundColor: client.overdue_count > 0 ? brandColors.error[100] : brandColors.primary[100],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: client.overdue_count > 0 ? brandColors.error[600] : brandColors.primary[600]
                  }}>
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Client Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.125rem'
                    }}>
                      <p style={{
                        fontSize: isMobile ? '0.875rem' : '0.9375rem',
                        fontWeight: '600',
                        color: brandColors.neutral[900],
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {client.name}
                      </p>
                      {client.overdue_count > 0 && (
                        <div style={{
                          backgroundColor: brandColors.error[100],
                          color: brandColors.error[700],
                          padding: '0.125rem 0.375rem',
                          borderRadius: '4px',
                          fontSize: '0.625rem',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          flexShrink: 0
                        }}>
                          <AlertTriangle size={10} />
                          {client.overdue_count}
                        </div>
                      )}
                    </div>
                    <p style={{
                      fontSize: '0.75rem',
                      color: brandColors.neutral[500],
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {client.company_name || client.email || client.phone || 'No contact info'}
                    </p>
                    </div>
                  </div>

                {/* Edit Icon */}
                {!isMobile && (
                  <div style={{
                        padding: '0.5rem',
                    backgroundColor: brandColors.neutral[50],
                    borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                  }}>
                      <Edit size={16} color={brandColors.neutral[600]} />
                  </div>
                )}
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Client Form Modal */}
      {showClientForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: 0
              }}>
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h2>
              <button
                onClick={resetForm}
                style={{
                  padding: '0.5rem',
                  backgroundColor: brandColors.neutral[100],
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} color={brandColors.neutral[600]} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter client name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[300]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Company Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Enter company name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[300]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Email */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[300]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Phone */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[300]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Address */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: brandColors.neutral[700],
                  marginBottom: '0.5rem'
                }}>
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter address"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${brandColors.neutral[300]}`,
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '2rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={resetForm}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: brandColors.neutral[100],
                  color: brandColors.neutral[700],
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveClient}
                disabled={saving || !formData.name.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: brandColors.primary[600],
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: saving || !formData.name.trim() ? 'not-allowed' : 'pointer',
                  opacity: saving || !formData.name.trim() ? 0.6 : 1
                }}
              >
                {saving ? 'Saving...' : (editingClient ? 'Update Client' : 'Create Client')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
