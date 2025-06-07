// Sistema de navegação entre abas
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const mainContent = document.getElementById('main-content');

    // Navegação entre abas
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            // Remove active class from all links and tabs
            navLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));

            // Add active class to clicked link
            this.classList.add('active');

            // Show corresponding tab
            const tabId = this.dataset.tab + '-tab';
            const targetTab = document.getElementById(tabId);
            if (targetTab) {
                targetTab.classList.add('active');
            }

            // Hide sidebar on mobile after click
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('show');
                sidebarOverlay.classList.remove('show');
            }
        });
    });

    // Toggle mobile menu
    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('show');
        sidebarOverlay.classList.toggle('show');
    });

    // Close sidebar when clicking overlay
    sidebarOverlay.addEventListener('click', function() {
        sidebar.classList.remove('show');
        sidebarOverlay.classList.remove('show');
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('show');
            sidebarOverlay.classList.remove('show');
        }
    });

    // Initialize data structures if not exists
    if (!localStorage.getItem('customers')) {
        localStorage.setItem('customers', JSON.stringify([]));
    }
    if (!localStorage.getItem('equipment')) {
        localStorage.setItem('equipment', JSON.stringify([]));
    }
    if (!localStorage.getItem('rentals')) {
        localStorage.setItem('rentals', JSON.stringify([]));
    }
    if (!localStorage.getItem('cashflow')) {
        localStorage.setItem('cashflow', JSON.stringify([]));
    }

    // Update dashboard stats
    updateDashboardStats();
    
    // Check for expired rentals
    checkExpiredRentals();
    
    // Set up periodic check for expired rentals (every 5 minutes)
    setInterval(checkExpiredRentals, 5 * 60 * 1000);
});

// Utility functions
function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now();
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('pt-BR');
}

function formatDateTime(date) {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('pt-BR') + ' ' + dateObj.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

async function updateDashboardStats() {
    try {
        const response = await fetch('/api/dashboard/stats/');
        if (!response.ok) {
            console.error('Error fetching dashboard stats:', response.status);
            return;
        }
        
        const stats = await response.json();
        
        // Update statistics cards
        document.getElementById('active-rentals').textContent = stats.active_rentals;
        document.getElementById('monthly-revenue').textContent = formatCurrency(parseFloat(stats.monthly_revenue));
        document.getElementById('available-equipment').textContent = stats.available_equipment;
        
        // Update recent rentals
        updateRecentRentals(stats.recent_rentals);
        
        // Update equipment stats
        updateEquipmentStats(stats.equipment_stats);
        
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

function updateRecentRentals(recentRentals) {
    const container = document.querySelector('#dashboard-tab .card:first-of-type .card-body');
    
    if (!recentRentals || recentRentals.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📋</div>
                <h3>Nenhum aluguel encontrado</h3>
                <p>Comece criando um novo aluguel</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Equipamento</th>
                        <th>Data Início</th>
                        <th>Status</th>
                        <th>Valor</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentRentals.map(rental => `
                        <tr>
                            <td>${rental.cliente_nome}</td>
                            <td>${rental.equipamento_nome}</td>
                            <td>${rental.data_inicio}</td>
                            <td><span class="badge badge-${getStatusClass(rental.status)}">${rental.status}</span></td>
                            <td>${rental.valor_total}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function updateEquipmentStats(equipmentStats) {
    const container = document.querySelector('#dashboard-tab .card:last-of-type .card-body');
    
    if (!equipmentStats || Object.keys(equipmentStats).length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">🔧</div>
                <h3>Nenhum equipamento cadastrado</h3>
                <p>Cadastre seus equipamentos para começar</p>
            </div>
        `;
        return;
    }
    
    // Map para ícones dos status
    const statusIcons = {
        'disponivel': '✅',
        'alugado': '🔄', 
        'manutencao': '🔧',
        'indisponivel': '❌'
    };
    
    container.innerHTML = `
        <div class="stats-grid">
            ${Object.entries(equipmentStats).map(([key, stat]) => `
                <div class="stat-item status-${key}">
                    <div class="stat-icon">${statusIcons[key] || '📊'}</div>
                    <div class="stat-value">${stat.count}</div>
                    <div class="stat-label">${stat.label}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function getStatusClass(status) {
    const statusMap = {
        'Aberto': 'info',
        'Em Andamento': 'warning', 
        'Fechado': 'success',
        'Cancelado': 'danger'
    };
    return statusMap[status] || 'secondary';
}

// Check for expired rentals and close them automatically
async function checkExpiredRentals() {
    try {
        // Option 1: Use the dedicated backend endpoint (more efficient)
        const response = await fetch('/api/alugueis/check-expired/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.closed_count > 0) {
                showNotification(`${result.closed_count} aluguel(éis) foram fechados automaticamente por data final atingida`, 'info');
                // Refresh the rentals table if we're on the rentals tab
                if (document.querySelector('[data-tab="rentals"]').classList.contains('active')) {
                    loadRentals();
                }
                updateDashboardStats();
            }
        } else {
            // Fallback to frontend verification if backend endpoint fails
            await checkExpiredRentalsFrontend();
        }
    } catch (error) {
        console.error('Erro ao verificar aluguéis expirados:', error);
        // Fallback to frontend verification
        await checkExpiredRentalsFrontend();
    }
}

// Fallback frontend verification method
async function checkExpiredRentalsFrontend() {
    try {
        const response = await fetch('/api/alugueis/');
        if (!response.ok) return;
        
        const rentals = await response.json();
        const now = new Date();
        let closedCount = 0;
        
        for (const rental of rentals) {
            // Check if rental has end date and is past due and still active
            if (rental.data_fim && 
                (rental.status === 'aberto' || rental.status === 'em_andamento')) {
                
                const endDate = new Date(rental.data_fim);
                
                // If current time is past the end date, close the rental
                if (now >= endDate) {
                    await closeRentalAutomatically(rental.id);
                    closedCount++;
                }
            }
        }
        
        if (closedCount > 0) {
            showNotification(`${closedCount} aluguel(éis) foram fechados automaticamente por data final atingida`, 'info');
            // Refresh the rentals table if we're on the rentals tab
            if (document.querySelector('[data-tab="rentals"]').classList.contains('active')) {
                loadRentals();
            }
            updateDashboardStats();
        }
    } catch (error) {
        console.error('Erro ao verificar aluguéis expirados (frontend):', error);
    }
}

// Close rental automatically (without confirmation)
async function closeRentalAutomatically(rentalId) {
    try {
        const response = await fetch(`/api/alugueis/${rentalId}/close/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: 'fechado',
                auto_closed: true
            })
        });
        
        return response.ok;
    } catch (error) {
        console.error('Erro ao fechar aluguel automaticamente:', error);
        return false;
    }
}

// Show notifications
function showNotification(message, type = 'success') {
    const alertClass = `alert-${type}`;
    const alertHtml = `
        <div class="alert ${alertClass}" style="position: fixed; top: 80px; right: 20px; z-index: 1001; min-width: 300px;">
            ${message}
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', alertHtml);

    setTimeout(() => {
        const alert = document.querySelector('.alert');
        if (alert) {
            alert.remove();
        }
    }, 3000);
}

// Customer management
document.getElementById('add-customer-btn')?.addEventListener('click', () => {
    showCustomerModal();
});

function showCustomerModal(customer = null) {
    const isEdit = customer !== null;
    const modalHtml = `
        <div class="modal-overlay" id="customer-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${isEdit ? 'Editar Cliente' : 'Adicionar Cliente'}</h3>
                    <button class="modal-close" onclick="closeCustomerModal()">&times;</button>
                </div>
                <form id="customer-form" class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Nome *</label>
                        <input type="text" class="form-control" id="customer-name" value="${customer?.nome || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">CPF *</label>
                        <input type="text" class="form-control" id="customer-cpf" value="${customer?.cpf || ''}" required maxlength="14" placeholder="000.000.000-00">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email *</label>
                        <input type="email" class="form-control" id="customer-email" value="${customer?.email || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Telefone *</label>
                        <input type="text" class="form-control" id="customer-phone" value="${customer?.telefone || ''}" required maxlength="15" placeholder="(00) 00000-0000">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Data de Nascimento *</label>
                        <input type="date" class="form-control" id="customer-birth" value="${customer?.data_nascimento || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Endereço *</label>
                        <textarea class="form-control" id="customer-address" rows="3" required>${customer?.endereco || ''}</textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeCustomerModal()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">${isEdit ? 'Atualizar' : 'Salvar'}</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Add event listener to form
    document.getElementById('customer-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveCustomer(customer);
    });

    // Format CPF input
    document.getElementById('customer-cpf').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        e.target.value = value;
    });

    // Format phone input
    document.getElementById('customer-phone').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{2})(\d)/, '($1) $2');
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
        e.target.value = value;
    });
}

function closeCustomerModal() {
    const modal = document.getElementById('customer-modal');
    if (modal) {
        modal.remove();
    }
}

async function saveCustomer(existingCustomer = null) {
    const name = document.getElementById('customer-name').value;
    const cpf = document.getElementById('customer-cpf').value;
    const email = document.getElementById('customer-email').value;
    const phone = document.getElementById('customer-phone').value;
    const birth = document.getElementById('customer-birth').value;
    const address = document.getElementById('customer-address').value;

    if (!name || !cpf || !email || !phone || !birth || !address) {
        showNotification('Por favor, preencha todos os campos obrigatórios', 'danger');
        return;
    }

    const customerData = {
        nome: name,
        cpf: cpf,
        email: email,
        telefone: phone,
        data_nascimento: birth,
        endereco: address
    };

    try {
        let response;
        if (existingCustomer) {
            // Update existing customer
            response = await fetch(`/api/clientes/${existingCustomer.id}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(customerData)
            });
            
            if (response.ok) {
                showNotification('Cliente atualizado com sucesso', 'success');
            } else {
                const error = await response.json();
                showNotification(error.error || 'Erro ao atualizar cliente', 'danger');
                return;
            }
        } else {
            // Add new customer
            response = await fetch('/api/clientes/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(customerData)
            });
            
            if (response.ok) {
                showNotification('Cliente cadastrado com sucesso', 'success');
            } else {
                const error = await response.json();
                showNotification(error.error || 'Erro ao cadastrar cliente', 'danger');
                return;
            }
        }

        loadCustomers();
        closeCustomerModal();
        updateDashboardStats();
    } catch (error) {
        showNotification('Erro de conexão. Tente novamente.', 'danger');
        console.error('Error:', error);
    }
}


async function deleteCustomer(customerId) {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
        try {
            const response = await fetch(`/api/clientes/${customerId}/`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showNotification('Cliente excluído com sucesso', 'success');
                loadCustomers();
                updateDashboardStats();
            } else {
                showNotification('Erro ao excluir cliente', 'danger');
            }
        } catch (error) {
            showNotification('Erro de conexão. Tente novamente.', 'danger');
            console.error('Error:', error);
        }
    }
}

// Search functionality
let allCustomers = [];

async function filterCustomers(searchTerm) {
    if (!searchTerm) {
        loadCustomers();
        return;
    }

    const filteredCustomers = allCustomers.filter(customer => 
        customer.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.cpf.includes(searchTerm) ||
        customer.telefone.includes(searchTerm)
    );
    
    const tbody = document.querySelector('#customers-table tbody');
    if (filteredCustomers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <div class="icon">🔍</div>
                        <h3>Nenhum cliente encontrado</h3>
                        <p>Tente buscar com outros termos</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredCustomers.map(customer => `
        <tr>
            <td>${customer.nome}</td>
            <td>${customer.telefone}</td>
            <td>${customer.email}</td>
            <td>${customer.cpf}</td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="showCustomerModal(${JSON.stringify(customer).replace(/"/g, '&quot;')})">
                    ✏️ Editar
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteCustomer('${customer.id}')">
                    🗑️ Excluir
                </button>
            </td>
        </tr>
    `).join('');
}

document.getElementById('customer-search')?.addEventListener('input', function(e) {
    filterCustomers(e.target.value);
});

// Load customers and store all customers for search
async function loadCustomers() {
    const tbody = document.querySelector('#customers-table tbody');
    
    try {
        const response = await fetch('/api/clientes/');
        allCustomers = await response.json();
        
        if (allCustomers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5">
                        <div class="empty-state">
                            <div class="icon">👥</div>
                            <h3>Nenhum cliente cadastrado</h3>
                            <p>Clique em "Adicionar Cliente" para começar</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = allCustomers.map(customer => `
            <tr>
                <td>${customer.nome}</td>
                <td>${customer.telefone}</td>
                <td>${customer.email}</td>
                <td>${customer.cpf}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="showCustomerModal(${JSON.stringify(customer).replace(/"/g, '&quot;')})">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCustomer('${customer.id}')">
                        🗑️ Excluir
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <div class="icon">⚠️</div>
                        <h3>Erro ao carregar clientes</h3>
                        <p>Tente recarregar a página</p>
                    </div>
                </td>
            </tr>
        `;
        console.error('Error loading customers:', error);
    }
}


// Load customers when customers tab is activated
document.querySelector('[data-tab="customers"]').addEventListener('click', function() {
    setTimeout(loadCustomers, 100);
});

// Load customers on page load if we're already on customers tab
if (window.location.pathname.includes('clientes')) {
    document.querySelector('[data-tab="customers"]').click();
}

// Equipment management
document.getElementById('add-equipment-btn')?.addEventListener('click', () => {
    showEquipmentModal();
});

function showEquipmentModal(equipment = null) {
    const isEdit = equipment !== null;
    const modalHtml = `
        <div class="modal-overlay" id="equipment-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${isEdit ? 'Editar Equipamento' : 'Adicionar Equipamento'}</h3>
                    <button class="modal-close" onclick="closeEquipmentModal()">&times;</button>
                </div>
                <form id="equipment-form" class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Nome do Equipamento *</label>
                        <input type="text" class="form-control" id="equipment-name" value="${equipment?.nome || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select class="form-control" id="equipment-status">
                            <option value="disponivel" ${equipment?.status === 'disponivel' ? 'selected' : ''}>Disponível</option>
                            <option value="alugado" ${equipment?.status === 'alugado' ? 'selected' : ''}>Alugado</option>
                            <option value="manutencao" ${equipment?.status === 'manutencao' ? 'selected' : ''}>Em Manutenção</option>
                            <option value="indisponivel" ${equipment?.status === 'indisponivel' ? 'selected' : ''}>Indisponível</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Valor Diário (R$) *</label>
                        <input type="number" class="form-control" id="equipment-daily-rate" step="0.01" min="0" value="${equipment?.valor_diario || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Foto do Equipamento</label>
                        <input type="file" class="form-control" id="equipment-photo" accept="image/*">
                        ${equipment?.foto ? `<small class="text-muted">Foto atual: ${equipment.foto}</small>` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeEquipmentModal()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">${isEdit ? 'Atualizar' : 'Salvar'}</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Add event listener to form
    document.getElementById('equipment-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveEquipment(equipment);
    });
}

function closeEquipmentModal() {
    const modal = document.getElementById('equipment-modal');
    if (modal) {
        modal.remove();
    }
}

async function saveEquipment(existingEquipment = null) {
    const name = document.getElementById('equipment-name').value;
    const status = document.getElementById('equipment-status').value;
    const dailyRate = document.getElementById('equipment-daily-rate').value;
    const photoFile = document.getElementById('equipment-photo').files[0];

    if (!name || !dailyRate) {
        showNotification('Por favor, preencha todos os campos obrigatórios', 'danger');
        return;
    }

    const formData = new FormData();
    formData.append('nome', name);
    formData.append('status', status);
    formData.append('valor_diario', parseFloat(dailyRate));
    
    if (photoFile) {
        formData.append('foto', photoFile);
    }

    try {
        let response;
        if (existingEquipment) {
            // Update existing equipment
            response = await fetch(`/api/equipamentos/${existingEquipment.id}/`, {
                method: 'PATCH',
                body: formData
            });
            
            if (response.ok) {
                showNotification('Equipamento atualizado com sucesso', 'success');
            } else {
                const error = await response.json();
                showNotification(error.error || 'Erro ao atualizar equipamento', 'danger');
                return;
            }
        } else {
            // Add new equipment
            response = await fetch('/api/equipamentos/', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                showNotification('Equipamento cadastrado com sucesso', 'success');
            } else {
                const error = await response.json();
                showNotification(error.error || 'Erro ao cadastrar equipamento', 'danger');
                return;
            }
        }

        loadEquipment();
        closeEquipmentModal();
        updateDashboardStats();
    } catch (error) {
        showNotification('Erro de conexão. Tente novamente.', 'danger');
        console.error('Error:', error);
    }
}

async function deleteEquipment(equipmentId) {
    if (confirm('Tem certeza que deseja excluir este equipamento?')) {
        try {
            const response = await fetch(`/api/equipamentos/${equipmentId}/`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showNotification('Equipamento excluído com sucesso', 'success');
                loadEquipment();
                updateDashboardStats();
            } else {
                showNotification('Erro ao excluir equipamento', 'danger');
            }
        } catch (error) {
            showNotification('Erro de conexão. Tente novamente.', 'danger');
            console.error('Error:', error);
        }
    }
}

// Equipment search functionality
let allEquipment = [];

async function filterEquipment(searchTerm) {
    if (!searchTerm) {
        loadEquipment();
        return;
    }

    const filteredEquipment = allEquipment.filter(equipment => 
        equipment.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipment.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const tbody = document.querySelector('#equipment-table tbody');
    if (filteredEquipment.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <div class="icon">🔍</div>
                        <h3>Nenhum equipamento encontrado</h3>
                        <p>Tente buscar com outros termos</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredEquipment.map(equipment => {
        const statusBadge = getStatusBadge(equipment.status);
        const photoHtml = equipment.foto ? 
            `<img src="${equipment.foto}" alt="${equipment.nome}" class="equipment-photo" onclick="showImagePreview('${equipment.foto}', '${equipment.nome}')">` :
            `<div class="no-photo">📷</div>`;
        
        return `
            <tr>
                <td>${photoHtml}</td>
                <td>${equipment.nome}</td>
                <td>${statusBadge}</td>
                <td>${formatCurrency(equipment.valor_diario)}</td>
                <td>${formatCurrency(equipment.valor_por_hora || (equipment.valor_diario / 24))}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="showEquipmentModal(${JSON.stringify(equipment).replace(/"/g, '&quot;')})">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEquipment('${equipment.id}')">
                        🗑️ Excluir
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function getStatusBadge(status) {
    const statusMap = {
        'disponivel': '<span class="badge badge-success">Disponível</span>',
        'alugado': '<span class="badge badge-info">Alugado</span>',
        'manutencao': '<span class="badge badge-warning">Em Manutenção</span>',
        'indisponivel': '<span class="badge badge-danger">Indisponível</span>'
    };
    return statusMap[status] || status;
}


document.getElementById('equipment-search')?.addEventListener('input', function(e) {
    filterEquipment(e.target.value);
});

// Load equipment and store all equipment for search
async function loadEquipment() {
    const tbody = document.querySelector('#equipment-table tbody');
    
    try {
        const response = await fetch('/api/equipamentos/');
        allEquipment = await response.json();
        
        if (allEquipment.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="empty-state">
                            <div class="icon">🔧</div>
                            <h3>Nenhum equipamento cadastrado</h3>
                            <p>Clique em "Adicionar Equipamento" para começar</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = allEquipment.map(equipment => {
            const statusBadge = getStatusBadge(equipment.status);
            const photoHtml = equipment.foto ? 
                `<img src="${equipment.foto}" alt="${equipment.nome}" class="equipment-photo" onclick="showImagePreview('${equipment.foto}', '${equipment.nome}')">` :
                `<div class="no-photo">📷</div>`;
            
            return `
                <tr>
                    <td>${photoHtml}</td>
                    <td>${equipment.nome}</td>
                    <td>${statusBadge}</td>
                    <td>${formatCurrency(equipment.valor_diario)}</td>
                    <td>${formatCurrency(equipment.valor_por_hora || (equipment.valor_diario / 24))}</td>
                    <td>
                        <button class="btn btn-sm btn-outline" onclick="showEquipmentModal(${JSON.stringify(equipment).replace(/"/g, '&quot;')})">
                            ✏️ Editar
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteEquipment('${equipment.id}')">
                            🗑️ Excluir
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <div class="icon">⚠️</div>
                        <h3>Erro ao carregar equipamentos</h3>
                        <p>Tente recarregar a página</p>
                    </div>
                </td>
            </tr>
        `;
        console.error('Error loading equipment:', error);
    }
}

// Load equipment when equipment tab is activated
document.querySelector('[data-tab="equipment"]').addEventListener('click', function() {
    setTimeout(loadEquipment, 100);
});

// Load equipment on page load if we're already on equipment tab
if (window.location.pathname.includes('equipamentos')) {
    document.querySelector('[data-tab="equipment"]').click();
}

// Rental management
document.getElementById('add-rental-btn')?.addEventListener('click', () => {
    showRentalModal();
});

function showRentalModal(rental = null) {
    const isEdit = rental !== null;
    
    // Get customers and equipment for the form
    fetch('/api/clientes/').then(res => res.json()).then(customers => {
        fetch('/api/equipamentos/').then(res => res.json()).then(equipment => {
            const availableEquipment = equipment.filter(e => e.status === 'disponivel' || (isEdit && e.id === rental?.equipamento?.id));
            
            const modalHtml = `
                <div class="modal-overlay" id="rental-modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>${isEdit ? 'Editar Aluguel' : 'Novo Aluguel'}</h3>
                            <button class="modal-close" onclick="closeRentalModal()">&times;</button>
                        </div>
                        <form id="rental-form" class="modal-body">
                            <div class="form-group">
                                <label class="form-label">Cliente *</label>
                                <div class="autocomplete-container">
                                    <input type="text" class="autocomplete-input" id="rental-customer-input" placeholder="Digite o nome do cliente..." value="${rental?.cliente?.nome || ''}" required>
                                    <input type="hidden" id="rental-customer" value="${rental?.cliente?.id || ''}">
                                    <div class="autocomplete-dropdown" id="customer-dropdown"></div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Equipamento *</label>
                                <div class="autocomplete-container">
                                    <input type="text" class="autocomplete-input" id="rental-equipment-input" placeholder="Digite o nome do equipamento..." value="${rental?.equipamento?.nome || ''}" required>
                                    <input type="hidden" id="rental-equipment" value="${rental?.equipamento?.id || ''}">
                                    <div class="autocomplete-dropdown" id="equipment-dropdown"></div>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Data/Hora Início *</label>
                                    <div class="datetime-input-group">
                                        <input type="datetime-local" class="form-control" id="rental-start" value="${rental?.data_inicio ? new Date(rental.data_inicio).toISOString().slice(0, 16) : ''}" required>
                                        <button type="button" class="datetime-now-btn" onclick="setCurrentDateTime('rental-start')">Agora</button>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Data/Hora Fim</label>
                                    <div class="datetime-input-group">
                                        <input type="datetime-local" class="form-control" id="rental-end" value="${rental?.data_fim ? new Date(rental.data_fim).toISOString().slice(0, 16) : ''}">
                                        <button type="button" class="datetime-now-btn" onclick="setCurrentDateTime('rental-end')">Agora</button>
                                    </div>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Valor Total (R$)</label>
                                    <input type="number" class="form-control" id="rental-total" step="0.01" min="0" value="${rental?.valor_total || ''}" placeholder="Calculado automaticamente">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Status</label>
                                    <select class="form-control" id="rental-status">
                                        <option value="aberto" ${rental?.status === 'aberto' ? 'selected' : ''}>Aberto</option>
                                        <option value="em_andamento" ${rental?.status === 'em_andamento' ? 'selected' : ''}>Em Andamento</option>
                                        <option value="fechado" ${rental?.status === 'fechado' ? 'selected' : ''}>Fechado</option>
                                        <option value="cancelado" ${rental?.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Observações</label>
                                <textarea class="form-control" id="rental-notes" rows="3" placeholder="Observações sobre o aluguel">${rental?.observacoes || ''}</textarea>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" onclick="closeRentalModal()">Cancelar</button>
                                <button type="submit" class="btn btn-primary">${isEdit ? 'Atualizar' : 'Salvar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Initialize autocomplete for customers and equipment
            setupCustomerAutocomplete(customers);
            setupEquipmentAutocomplete(availableEquipment);
            
            // Set daily rate for existing rental
            if (rental && rental.equipamento) {
                const equipmentHiddenInput = document.getElementById('rental-equipment');
                const selectedEquipment = availableEquipment.find(e => e.id === rental.equipamento.id);
                if (selectedEquipment) {
                    equipmentHiddenInput.dataset.dailyRate = selectedEquipment.valor_diario;
                }
            }
            
            // Add event listener to form
            document.getElementById('rental-form').addEventListener('submit', function(e) {
                e.preventDefault();
                saveRental(rental);
            });

            // Auto-calculate total when dates change
            const startInput = document.getElementById('rental-start');
            const endInput = document.getElementById('rental-end');
            const equipmentHiddenInput = document.getElementById('rental-equipment');
            const totalInput = document.getElementById('rental-total');

            function calculateTotal() {
                const start = startInput.value;
                const end = endInput.value;
                const dailyRate = parseFloat(equipmentHiddenInput.dataset.dailyRate);
                
                console.log('Calculate Total - Start:', start, 'End:', end, 'Daily Rate:', dailyRate);
                
                if (start && end && dailyRate && !isNaN(dailyRate)) {
                    const startDate = new Date(start);
                    const endDate = new Date(end);
                    const hours = (endDate - startDate) / (1000 * 60 * 60);
                    
                    console.log('Hours difference:', hours);
                    
                    if (hours > 0) {
                        const hourlyRate = dailyRate / 24;
                        const total = hours * hourlyRate;
                        totalInput.value = total.toFixed(2);
                        console.log('New total calculated:', total.toFixed(2));
                    } else {
                        totalInput.value = '';
                    }
                } else {
                    console.log('Missing data for calculation');
                }
            }

            // Add event listeners for automatic calculation
            startInput.addEventListener('change', calculateTotal);
            startInput.addEventListener('input', calculateTotal);
            endInput.addEventListener('change', calculateTotal);
            endInput.addEventListener('input', calculateTotal);
            
            // Initial calculation for existing rentals
            setTimeout(() => {
                if (rental && equipmentHiddenInput.dataset.dailyRate && startInput.value) {
                    calculateTotal();
                }
            }, 100);
        }).catch(error => {
            console.error('Error loading equipment:', error);
            showNotification('Erro ao carregar equipamentos', 'danger');
        });
    }).catch(error => {
        console.error('Error loading customers:', error);
        showNotification('Erro ao carregar clientes', 'danger');
    });
}

function closeRentalModal() {
    const modal = document.getElementById('rental-modal');
    if (modal) {
        modal.remove();
    }
}

async function saveRental(existingRental = null) {
    const customerId = document.getElementById('rental-customer').value;
    const equipmentId = document.getElementById('rental-equipment').value;
    const startDate = document.getElementById('rental-start').value;
    const endDate = document.getElementById('rental-end').value;
    const total = document.getElementById('rental-total').value;
    const status = document.getElementById('rental-status').value;
    const notes = document.getElementById('rental-notes').value;

    if (!customerId || !equipmentId || !startDate) {
        showNotification('Por favor, preencha os campos obrigatórios', 'danger');
        return;
    }

    const rentalData = {
        cliente: customerId,
        equipamento: equipmentId,
        data_inicio: startDate,
        data_fim: endDate || null,
        valor_total: total ? parseFloat(total) : null,
        status: status,
        observacoes: notes || ''
    };

    try {
        let response;
        if (existingRental) {
            // Update existing rental
            response = await fetch(`/api/alugueis/${existingRental.id}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(rentalData)
            });
            
            if (response.ok) {
                showNotification('Aluguel atualizado com sucesso', 'success');
            } else {
                const error = await response.json();
                showNotification(error.error || 'Erro ao atualizar aluguel', 'danger');
                return;
            }
        } else {
            // Add new rental
            response = await fetch('/api/alugueis/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(rentalData)
            });
            
            if (response.ok) {
                showNotification('Aluguel criado com sucesso', 'success');
            } else {
                const error = await response.json();
                showNotification(error.error || 'Erro ao criar aluguel', 'danger');
                return;
            }
        }

        loadRentals();
        closeRentalModal();
        updateDashboardStats();
    } catch (error) {
        showNotification('Erro de conexão. Tente novamente.', 'danger');
        console.error('Error:', error);
    }
}

async function deleteRental(rentalId) {
    if (confirm('Tem certeza que deseja excluir este aluguel?')) {
        try {
            const response = await fetch(`/api/alugueis/${rentalId}/`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showNotification('Aluguel excluído com sucesso', 'success');
                loadRentals();
                updateDashboardStats();
            } else {
                showNotification('Erro ao excluir aluguel', 'danger');
            }
        } catch (error) {
            showNotification('Erro de conexão. Tente novamente.', 'danger');
            console.error('Error:', error);
        }
    }
}

// Quick actions for rentals
async function closeRental(rentalId) {
    if (confirm('Deseja fechar este aluguel? O status será alterado para "Fechado".')) {
        try {
            // First get the current rental data to check if data_fim exists
            const getCurrentRental = await fetch(`/api/alugueis/${rentalId}/`);
            const currentRental = await getCurrentRental.json();
            
            // Only set data_fim to now if it's not already set
            const requestBody = {
                status: 'fechado'
            };
            
            if (!currentRental.data_fim) {
                const now = new Date();
                requestBody.data_fim = now.toISOString();
            }
            
            const response = await fetch(`/api/alugueis/${rentalId}/close/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (response.ok) {
                showNotification('Aluguel fechado com sucesso', 'success');
                loadRentals();
                updateDashboardStats();
            } else {
                const error = await response.json();
                showNotification(error.error || 'Erro ao fechar aluguel', 'danger');
            }
        } catch (error) {
            showNotification('Erro de conexão. Tente novamente.', 'danger');
            console.error('Error:', error);
        }
    }
}

// Rental search functionality
let allRentals = [];

async function filterRentals(searchTerm) {
    if (!searchTerm) {
        loadRentals();
        return;
    }

    const filteredRentals = allRentals.filter(rental => 
        rental.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rental.equipamento.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rental.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const tbody = document.querySelector('#rentals-table tbody');
    if (filteredRentals.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div class="icon">🔍</div>
                        <h3>Nenhum aluguel encontrado</h3>
                        <p>Tente buscar com outros termos</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredRentals.map(rental => {
        const statusBadge = getRentalStatusBadge(rental.status);
        const actionsHtml = getActionButtons(rental);
        
        return `
            <tr>
                <td>${rental.cliente.nome}</td>
                <td>${rental.equipamento.nome}</td>
                <td>${formatDateTime(rental.data_inicio)}</td>
                <td>${rental.data_fim ? formatDateTime(rental.data_fim) : 'Em aberto'}</td>
                <td>${rental.valor_total ? formatCurrency(rental.valor_total) : 'A calcular'}</td>
                <td>${statusBadge}</td>
                <td>${actionsHtml}</td>
            </tr>
        `;
    }).join('');
}

function getRentalStatusBadge(status) {
    const statusMap = {
        'aberto': '<span class="badge badge-info">Aberto</span>',
        'em_andamento': '<span class="badge badge-warning">Em Andamento</span>',
        'fechado': '<span class="badge badge-success">Fechado</span>',
        'cancelado': '<span class="badge badge-danger">Cancelado</span>'
    };
    return statusMap[status] || status;
}

function getActionButtons(rental) {
    let buttons = `
        <button class="btn btn-sm btn-outline" onclick="showRentalModal(${JSON.stringify(rental).replace(/"/g, '&quot;')})">
            ✏️ Editar
        </button>
    `;
    
    if (rental.status === 'aberto' || rental.status === 'em_andamento') {
        buttons += `
            <button class="btn btn-sm btn-success" onclick="closeRental('${rental.id}')">
                ✅ Fechar
            </button>
        `;
    }
    
    buttons += `
        <button class="btn btn-sm btn-danger" onclick="deleteRental('${rental.id}')">
            🗑️ Excluir
        </button>
    `;
    
    return buttons;
}

document.getElementById('rental-search')?.addEventListener('input', function(e) {
    filterRentals(e.target.value);
});

// Load rentals and store all rentals for search
async function loadRentals() {
    const tbody = document.querySelector('#rentals-table tbody');
    
    try {
        const response = await fetch('/api/alugueis/');
        allRentals = await response.json();
        
        if (allRentals.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <div class="icon">📋</div>
                            <h3>Nenhum aluguel registrado</h3>
                            <p>Clique em "Novo Aluguel" para começar</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = allRentals.map(rental => {
            const statusBadge = getRentalStatusBadge(rental.status);
            const actionsHtml = getActionButtons(rental);
            
            return `
                <tr>
                    <td>${rental.cliente.nome}</td>
                    <td>${rental.equipamento.nome}</td>
                    <td>${formatDateTime(rental.data_inicio)}</td>
                    <td>${rental.data_fim ? formatDateTime(rental.data_fim) : 'Em aberto'}</td>
                    <td>${rental.valor_total ? formatCurrency(rental.valor_total) : 'A calcular'}</td>
                    <td>${statusBadge}</td>
                    <td>${actionsHtml}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div class="icon">⚠️</div>
                        <h3>Erro ao carregar aluguéis</h3>
                        <p>Tente recarregar a página</p>
                    </div>
                </td>
            </tr>
        `;
        console.error('Error loading rentals:', error);
    }
}

// Load rentals when rentals tab is activated
document.querySelector('[data-tab="rentals"]').addEventListener('click', function() {
    setTimeout(loadRentals, 100);
});

// Load rentals on page load if we're already on rentals tab
if (window.location.pathname.includes('alugueis')) {
    document.querySelector('[data-tab="rentals"]').click();
}

// Function to set current date and time (local timezone)
function setCurrentDateTime(inputId) {
    const now = new Date();
    // Adjust for local timezone offset to get local time in ISO format
    const timeZoneOffset = now.getTimezoneOffset() * 60000; // offset in milliseconds
    const localTime = new Date(now.getTime() - timeZoneOffset);
    const isoString = localTime.toISOString().slice(0, 16);
    document.getElementById(inputId).value = isoString;
    
    // Trigger change event to recalculate total
    document.getElementById(inputId).dispatchEvent(new Event('change'));
}

// Customer autocomplete setup
function setupCustomerAutocomplete(customers) {
    const input = document.getElementById('rental-customer-input');
    const hiddenInput = document.getElementById('rental-customer');
    const dropdown = document.getElementById('customer-dropdown');
    
    let selectedIndex = -1;
    let filteredCustomers = [];
    
    input.addEventListener('input', function() {
        const value = this.value.toLowerCase();
        if (value.length === 0) {
            dropdown.classList.remove('show');
            hiddenInput.value = '';
            return;
        }
        
        filteredCustomers = customers.filter(customer => 
            customer.nome.toLowerCase().includes(value) ||
            customer.email.toLowerCase().includes(value) ||
            customer.cpf.includes(value)
        );
        
        showCustomerDropdown(filteredCustomers);
        selectedIndex = -1;
    });
    
    input.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, filteredCustomers.length - 1);
            updateCustomerSelection();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            updateCustomerSelection();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0) {
                selectCustomer(filteredCustomers[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            dropdown.classList.remove('show');
        }
    });
    
    input.addEventListener('blur', function() {
        // Delay hiding dropdown to allow clicking on items
        setTimeout(() => {
            dropdown.classList.remove('show');
        }, 200);
    });
    
    function showCustomerDropdown(customerList) {
        if (customerList.length === 0) {
            dropdown.innerHTML = '<div class="autocomplete-item">Nenhum cliente encontrado</div>';
        } else {
            dropdown.innerHTML = customerList.map((customer, index) => `
                <div class="autocomplete-item" data-index="${index}" onclick="selectCustomer(${JSON.stringify(customer).replace(/"/g, '&quot;')})">
                    <div class="autocomplete-item-content">
                        <div class="autocomplete-item-title">${customer.nome}</div>
                        <div class="autocomplete-item-subtitle">${customer.email} - ${customer.telefone}</div>
                    </div>
                </div>
            `).join('');
        }
        dropdown.classList.add('show');
    }
    
    function updateCustomerSelection() {
        const items = dropdown.querySelectorAll('.autocomplete-item');
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === selectedIndex);
        });
    }
    
    window.selectCustomer = function(customer) {
        input.value = customer.nome;
        hiddenInput.value = customer.id;
        dropdown.classList.remove('show');
        selectedIndex = -1;
    };
}

// Equipment autocomplete setup
function setupEquipmentAutocomplete(equipment) {
    const input = document.getElementById('rental-equipment-input');
    const hiddenInput = document.getElementById('rental-equipment');
    const dropdown = document.getElementById('equipment-dropdown');
    
    let selectedIndex = -1;
    let filteredEquipment = [];
    
    input.addEventListener('input', function() {
        const value = this.value.toLowerCase();
        if (value.length === 0) {
            dropdown.classList.remove('show');
            hiddenInput.value = '';
            hiddenInput.dataset.dailyRate = '';
            return;
        }
        
        filteredEquipment = equipment.filter(equip => 
            equip.nome.toLowerCase().includes(value)
        );
        
        showEquipmentDropdown(filteredEquipment);
        selectedIndex = -1;
    });
    
    input.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, filteredEquipment.length - 1);
            updateEquipmentSelection();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            updateEquipmentSelection();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0) {
                selectEquipment(filteredEquipment[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            dropdown.classList.remove('show');
        }
    });
    
    input.addEventListener('blur', function() {
        // Delay hiding dropdown to allow clicking on items
        setTimeout(() => {
            dropdown.classList.remove('show');
        }, 200);
    });
    
    function showEquipmentDropdown(equipmentList) {
        if (equipmentList.length === 0) {
            dropdown.innerHTML = '<div class="autocomplete-item">Nenhum equipamento encontrado</div>';
        } else {
            dropdown.innerHTML = equipmentList.map((equip, index) => {
                const imageHtml = equip.foto ? 
                    `<img src="${equip.foto}" alt="${equip.nome}" class="equipment-preview">` :
                    `<div class="equipment-no-image">🔧</div>`;
                
                return `
                    <div class="autocomplete-item" data-index="${index}" onclick="selectEquipment(${JSON.stringify(equip).replace(/"/g, '&quot;')})">
                        ${imageHtml}
                        <div class="autocomplete-item-content">
                            <div class="autocomplete-item-title">${equip.nome}</div>
                            <div class="autocomplete-item-subtitle">${formatCurrency(equip.valor_diario)}/dia - ${getStatusBadge(equip.status)}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }
        dropdown.classList.add('show');
    }
    
    function updateEquipmentSelection() {
        const items = dropdown.querySelectorAll('.autocomplete-item');
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === selectedIndex);
        });
    }
    
    window.selectEquipment = function(equip) {
        input.value = equip.nome;
        hiddenInput.value = equip.id;
        hiddenInput.dataset.dailyRate = equip.valor_diario;
        dropdown.classList.remove('show');
        selectedIndex = -1;
        
        // Trigger calculation when equipment is selected
        const startInput = document.getElementById('rental-start');
        const endInput = document.getElementById('rental-end');
        if (startInput && endInput) {
            // Trigger both start and end to ensure calculation happens
            startInput.dispatchEvent(new Event('change'));
            endInput.dispatchEvent(new Event('change'));
        }
    };
}

document.getElementById('add-expense-btn')?.addEventListener('click', () => {
    showNotification('Funcionalidade de adicionar despesa será implementada na próxima fase', 'info');
});

document.getElementById('export-json-btn')?.addEventListener('click', () => {
    showNotification('Funcionalidade de exportação será implementada na próxima fase', 'info');
});

document.getElementById('export-excel-btn')?.addEventListener('click', () => {
    showNotification('Funcionalidade de exportação será implementada na próxima fase', 'info');
});

document.getElementById('import-json-btn')?.addEventListener('click', () => {
    showNotification('Funcionalidade de importação será implementada na próxima fase', 'info');
});

document.getElementById('clear-data-btn')?.addEventListener('click', () => {
    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
        localStorage.clear();
        localStorage.setItem('customers', JSON.stringify([]));
        localStorage.setItem('equipment', JSON.stringify([]));
        localStorage.setItem('rentals', JSON.stringify([]));
        localStorage.setItem('cashflow', JSON.stringify([]));
        updateDashboardStats();
        showNotification('Todos os dados foram limpos', 'success');
    }
});

// Image preview functions
function showImagePreview(imageUrl, equipmentName) {
    const modal = document.getElementById('image-preview-modal');
    const img = document.getElementById('image-preview-img');
    const title = document.getElementById('image-preview-title');
    
    img.src = imageUrl;
    img.alt = equipmentName;
    title.textContent = `Foto do equipamento: ${equipmentName}`;
    
    modal.classList.add('show');
}

function closeImagePreview() {
    const modal = document.getElementById('image-preview-modal');
    modal.classList.remove('show');
}

// Close image preview when clicking outside the image
document.getElementById('image-preview-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeImagePreview();
    }
});

// Close image preview with ESC key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeImagePreview();
    }
});