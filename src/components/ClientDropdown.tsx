import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../lib/useAuth'
import { supabase } from '../lib/supabaseClient'
import { brandColors } from '../stylings'
import { ChevronDown, User, Building2 } from 'lucide-react'

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  company_name?: string
  country_code?: string
  country_name?: string
}

interface ClientDropdownProps {
  onClientSelect: (client: Client) => void
  selectedClientId?: string
  placeholder?: string
}

export default function ClientDropdown({
  onClientSelect,
  selectedClientId,
  placeholder = 'Select a client...'
}: ClientDropdownProps) {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load clients from database
  useEffect(() => {
    if (user) {
      loadClients()
    }
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Update selected client when selectedClientId changes
  useEffect(() => {
    if (selectedClientId && clients.length > 0) {
      const client = clients.find(c => c.id === selectedClientId)
      if (client) {
        setSelectedClient(client)
      }
    }
  }, [selectedClientId, clients])

  const loadClients = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading clients:', error)
        return
      }

      setClients(data || [])
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setIsOpen(false)
    onClientSelect(client)
  }

  const getClientInitials = (name: string) => {
    const words = name.split(' ')
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          backgroundColor: brandColors.white,
          border: `1px solid ${isOpen ? brandColors.primary[400] : brandColors.neutral[300]}`,
          borderRadius: '8px',
          fontSize: '0.875rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxSizing: 'border-box'
        }}
      >
        {selectedClient ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            {/* Avatar */}
            <div style={{
              width: '32px',
              height: '32px',
              minWidth: '32px',
              borderRadius: '50%',
              backgroundColor: brandColors.primary[100],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: brandColors.primary[600]
            }}>
              {getClientInitials(selectedClient.name)}
            </div>

            {/* Client Info */}
            <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: brandColors.neutral[900],
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {selectedClient.name}
              </p>
              {selectedClient.company_name && (
                <p style={{
                  fontSize: '0.75rem',
                  color: brandColors.neutral[500],
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {selectedClient.company_name}
                </p>
              )}
            </div>
          </div>
        ) : (
          <span style={{ color: brandColors.neutral[400] }}>{placeholder}</span>
        )}

        <ChevronDown 
          size={18} 
          color={brandColors.neutral[500]}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '0.5rem',
          backgroundColor: brandColors.white,
          border: `1px solid ${brandColors.neutral[200]}`,
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 1000
        }}>
          {clients.length > 0 ? (
            clients.map((client, index) => (
              <button
                key={client.id}
                onClick={() => handleClientSelect(client)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1rem',
                  backgroundColor: selectedClient?.id === client.id ? brandColors.primary[50] : 'transparent',
                  border: 'none',
                  borderBottom: index < clients.length - 1 ? `1px solid ${brandColors.neutral[100]}` : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (selectedClient?.id !== client.id) {
                    e.currentTarget.style.backgroundColor = brandColors.neutral[50]
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedClient?.id !== client.id) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  minWidth: '40px',
                  borderRadius: '50%',
                  backgroundColor: selectedClient?.id === client.id ? brandColors.primary[200] : brandColors.primary[100],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: brandColors.primary[600]
                }}>
                  {getClientInitials(client.name)}
                </div>

                {/* Client Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: client.email || client.company_name ? '0.25rem' : 0
                  }}>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: brandColors.neutral[900],
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {client.name}
                    </p>
                    {client.company_name && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.125rem 0.5rem',
                        backgroundColor: brandColors.neutral[100],
                        borderRadius: '4px',
                        flexShrink: 0
                      }}>
                        <Building2 size={10} color={brandColors.neutral[600]} />
                        <span style={{
                          fontSize: '0.6875rem',
                          color: brandColors.neutral[600],
                          fontWeight: '500',
                          maxWidth: '100px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {client.company_name}
                        </span>
                      </div>
                    )}
                  </div>
                  {client.email && (
                    <p style={{
                      fontSize: '0.75rem',
                      color: brandColors.neutral[500],
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {client.email}
                    </p>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              color: brandColors.neutral[500]
            }}>
              <User size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
              <p style={{ fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>
                No clients yet
              </p>
              <p style={{ fontSize: '0.75rem', margin: 0, color: brandColors.neutral[400] }}>
                Add clients from the Clients page
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

