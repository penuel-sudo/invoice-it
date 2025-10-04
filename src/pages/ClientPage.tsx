import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import { brandColors } from '../stylings'
import { Layout } from '../components/layout'
import { supabase } from '../lib/supabaseClient'
import {
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
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
        // Update existing client
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
        // Create new client
        const { error } = await supabase
          .from('clients')
          .insert({
            user_id: user.id,
            name: formData.name.trim(),
            email: formData.email.trim() || null,
            phone: formData.phone.trim() || null,
            address: formData.address.trim() || null,
            company_name: formData.company_name.trim() || null
          })

        if (error) {
          console.error('Error creating client:', error)
          toast.error('Failed to create client')
          return
        }

        toast.success('Client created successfully!')
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

  const handleDeleteClient = async (clientId: string) => {
    if (!user) return

    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting client:', error)
        toast.error('Failed to delete client')
        return
      }

      toast.success('Client deleted successfully!')
      loadClients()
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('Failed to delete client')
    }
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
        backgroundColor: 'white',
        borderBottom: `1px solid ${brandColors.neutral[200]}`,
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '0.5rem',
            backgroundColor: brandColors.neutral[100],
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: brandColors.neutral[600],
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          <ArrowLeft size={16} />
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
        {/* Statistics - Mobile vs Desktop */}
        {isMobile ? (
          /* Mobile: Simple horizontal stats bar */
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${brandColors.neutral[100]}`
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              textAlign: 'center'
            }}>
              <div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: brandColors.neutral[900],
                  marginBottom: '0.25rem'
                }}>
                  {totalClients}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: brandColors.neutral[600],
                  fontWeight: '500'
                }}>
                  Total
                </div>
              </div>
              <div style={{
                width: '1px',
                height: '30px',
                backgroundColor: brandColors.neutral[200]
              }}></div>
              <div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: brandColors.error[600],
                  marginBottom: '0.25rem'
                }}>
                  {clientsWithOverdue}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: brandColors.neutral[600],
                  fontWeight: '500'
                }}>
                  Overdue
                </div>
              </div>
              <div style={{
                width: '1px',
                height: '30px',
                backgroundColor: brandColors.neutral[200]
              }}></div>
              <div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: brandColors.warning[600],
                  marginBottom: '0.25rem'
                }}>
                  {totalOverdueCount}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: brandColors.neutral[600],
                  fontWeight: '500'
                }}>
                  Count
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Desktop: Full stats cards */
        <div style={{
          display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {/* Total Clients */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${brandColors.neutral[100]}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: brandColors.primary[100],
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users size={20} color={brandColors.primary[600]} />
              </div>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: 0
              }}>
                Total Clients
              </h3>
            </div>
            <p style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: brandColors.neutral[900],
              margin: 0
            }}>
              {totalClients}
            </p>
          </div>

          {/* Clients with Overdue */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${brandColors.neutral[100]}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: brandColors.error[100],
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={20} color={brandColors.error[600]} />
              </div>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: 0
              }}>
                With Overdue
              </h3>
            </div>
            <p style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: brandColors.error[600],
              margin: 0
            }}>
              {clientsWithOverdue}
            </p>
          </div>

          {/* Total Overdue Count */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: `1px solid ${brandColors.neutral[100]}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: brandColors.warning[100],
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DollarSign size={20} color={brandColors.warning[600]} />
              </div>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: brandColors.neutral[900],
                margin: 0
              }}>
                Total Overdue
              </h3>
            </div>
            <p style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: brandColors.warning[600],
              margin: 0
            }}>
              {totalOverdueCount}
            </p>
          </div>
        </div>
        )}

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

        {/* Clients List */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: `1px solid ${brandColors.neutral[100]}`
        }}>
          {filteredClients.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center'
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
            <div>
              {filteredClients.map((client, index) => (
                <div
                  key={client.id}
                  style={{
                    padding: '1.5rem',
                    borderBottom: index < filteredClients.length - 1 ? `1px solid ${brandColors.neutral[100]}` : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  {/* Client Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.5rem'
                    }}>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: brandColors.neutral[900],
                        margin: 0
                      }}>
                        {client.name}
                      </h3>
                      {client.overdue_count > 0 && (
                        <div style={{
                          backgroundColor: brandColors.error[100],
                          color: brandColors.error[700],
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <AlertTriangle size={12} />
                          {client.overdue_count} overdue
                        </div>
                      )}
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem'
                    }}>
                      {client.company_name && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          color: brandColors.neutral[600]
                        }}>
                          <Building size={14} />
                          {client.company_name}
                        </div>
                      )}
                      {client.email && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          color: brandColors.neutral[600]
                        }}>
                          <Mail size={14} />
                          {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          color: brandColors.neutral[600]
                        }}>
                          <Phone size={14} />
                          {client.phone}
                        </div>
                      )}
                      {client.address && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          color: brandColors.neutral[600]
                        }}>
                          <MapPin size={14} />
                          {client.address}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <button
                      onClick={() => handleEditClient(client)}
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
                      <Edit size={16} color={brandColors.neutral[600]} />
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: brandColors.error[100],
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={16} color={brandColors.error[600]} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
