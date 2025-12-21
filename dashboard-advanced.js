// Aetheron Dashboard - Premium JavaScript Features
class AetheronDashboard {
    constructor() {
        this.currentPage = "dashboard";
        this.theme = localStorage.getItem("theme") || "dark";
        this.themeVariant = localStorage.getItem("themeVariant") || "default";
        this.sidebarOpen = true;
        this.currentUser = {
            name: "John Doe",
            email: "john.doe@aetheron.com",
            role: "Administrator",
            avatar: "JD"
        };
        
        // Command Palette State
        this.commandPaletteOpen = false;
        this.commands = [
            { id: "dashboard", label: "Go to Dashboard", icon: "🏠", action: () => this.navigateToPage("dashboard") },
            { id: "analytics", label: "View Analytics", icon: "📊", action: () => this.navigateToPage("analytics") },
            { id: "users", label: "Manage Users", icon: "👥", action: () => this.navigateToPage("users") },
            { id: "settings", label: "Open Settings", icon: "⚙️", action: () => this.openSettings() },
            { id: "theme-toggle", label: "Toggle Theme", icon: "🌙", action: () => this.toggleTheme() },
            { id: "logout", label: "Sign Out", icon: "🚪", action: () => this.logout() },
            { id: "help", label: "Show Help", icon: "❓", action: () => this.showHelp() },
            { id: "search", label: "Search Data", icon: "🔍", action: () => this.focusSearch() },
            { id: "export", label: "Export Data", icon: "💾", action: () => this.exportTableData() },
            { id: "refresh", label: "Refresh Dashboard", icon: "🔄", action: () => this.refreshData() }
        ];
        
        // Tour/Onboarding State
        this.tourActive = false;
        this.currentTourStep = 0;
        this.tourSteps = [
            { target: ".sidebar", title: "Navigation", content: "Use the sidebar to navigate between different sections of the dashboard." },
            { target: ".header", title: "Header Controls", content: "Access theme settings, notifications, and user menu from the header." },
            { target: ".dashboard-grid", title: "Key Metrics", content: "Monitor your key performance indicators at a glance." },
            { target: ".alert", title: "System Alerts", content: "Stay informed about system status and important updates." },
            { target: ".card:last-child", title: "Activity Log", content: "Track all system activities and user actions." },
            { target: ".header-actions", title: "Quick Actions", content: "Access theme switching and notifications from here!" }
        ];
        
        // Widget Customization State
        this.widgetLayout = JSON.parse(localStorage.getItem("widgetLayout")) || [
            { id: "stats", position: 1, visible: true },
            { id: "chart", position: 2, visible: true },
            { id: "activity", position: 3, visible: true },
            { id: "system", position: 4, visible: true }
        ];
        
        // Favorites State
        this.favorites = JSON.parse(localStorage.getItem("favorites")) || [
            { id: "dashboard", label: "Dashboard", icon: "🏠", page: "dashboard" },
            { id: "analytics", label: "Analytics", icon: "📊", page: "analytics" },
            { id: "users", label: "Users", icon: "👥", page: "users" }
        ];
        
        // Breadcrumb State
        this.breadcrumbs = [{ label: "Dashboard", page: "dashboard" }];
        
        // Chart State
        this.currentChartType = "line";
        this.chartData = {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            datasets: [{
                label: "Performance",
                data: [65, 78, 90, 81, 95, 88],
                borderColor: "#4f46e5",
                backgroundColor: "rgba(79, 70, 229, 0.1)",
                tension: 0.4
            }]
        };
        
        // Bulk Operations State
        this.selectedItems = new Set();
        this.bulkOperationsVisible = false;
        
        // Offline/PWA State
        this.isOnline = navigator.onLine;
        this.isInstalled = window.matchMedia("(display-mode: standalone)").matches;
        
        // AI Chat State
        this.chatOpen = false;
        this.chatHistory = [];
        
        // Sample data
        this.activityData = [
            { user: "john.doe@example.com", action: "Login Attempt", status: "success", time: "2 minutes ago", type: "login" },
            { user: "admin@aetheron.com", action: "System Update", status: "success", time: "15 minutes ago", type: "update" },
            { user: "user123@domain.com", action: "Password Reset", status: "warning", time: "1 hour ago", type: "reset" },
            { user: "support@company.com", action: "Backup Process", status: "success", time: "2 hours ago", type: "backup" },
            { user: "test@example.com", action: "Login Attempt", status: "error", time: "3 hours ago", type: "login" },
            { user: "manager@company.com", action: "Data Export", status: "success", time: "4 hours ago", type: "export" },
            { user: "dev@aetheron.com", action: "Code Deploy", status: "success", time: "5 hours ago", type: "deploy" },
            { user: "user456@domain.com", action: "File Upload", status: "warning", time: "6 hours ago", type: "upload" }
        ];
        
        this.filteredData = [...this.activityData];
        this.currentPage = 1;
        this.itemsPerPage = 4;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.applyTheme();
        this.setupKeyboardShortcuts();
        this.initializeChart();
        this.initializeCalendar();
        this.renderActivityTable();
        this.startRealTimeUpdates();
        this.setupSearch();
        this.setupFileUpload();
        this.loadUserPreferences();
        this.initializeCommandPalette();
        this.initializeTour();
        this.initializeWidgetCustomization();
        this.initializeFavorites();
        this.updateBreadcrumbs();
        this.initializeOfflineDetection();
        this.initializeAIChat();
        this.loadWidgetLayout();
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById("themeToggle");
        if (themeToggle) {
            themeToggle.addEventListener("click", () => this.toggleTheme());
        }

        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById("mobileMenuToggle");
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener("click", () => this.toggleSidebar());
        }

        // Navigation
        document.querySelectorAll(".nav-link").forEach(link => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const page = link.getAttribute("data-page");
                this.navigateToPage(page);
            });
        });

        // Modals
        this.setupModalEvents();

        // Settings panel
        const settingsBtn = document.getElementById("settingsBtn");
        const closeSettings = document.getElementById("closeSettings");
        const settingsPanel = document.getElementById("settingsPanel");
        
        if (settingsBtn) {
            settingsBtn.addEventListener("click", () => {
                settingsPanel.classList.add("open");
            });
        }
        
        if (closeSettings) {
            closeSettings.addEventListener("click", () => {
                settingsPanel.classList.remove("open");
            });
        }

        // Notification button
        const notificationBtn = document.getElementById("notificationBtn");
        if (notificationBtn) {
            notificationBtn.addEventListener("click", () => this.showNotifications());
        }

        // Table filters
        const statusFilter = document.getElementById("statusFilter");
        const typeFilter = document.getElementById("typeFilter");
        
        if (statusFilter) {
            statusFilter.addEventListener("change", () => this.filterTable());
        }
        
        if (typeFilter) {
            typeFilter.addEventListener("change", () => this.filterTable());
        }

        // Table pagination
        const prevPage = document.getElementById("prevPage");
        const nextPage = document.getElementById("nextPage");
        
        if (prevPage) {
            prevPage.addEventListener("click", () => this.changePage(-1));
        }
        
        if (nextPage) {
            nextPage.addEventListener("click", () => this.changePage(1));
        }

        // Refresh button
        const refreshBtn = document.getElementById("refreshBtn");
        if (refreshBtn) {
            refreshBtn.addEventListener("click", () => this.refreshData());
        }

        // Export button
        const exportBtn = document.getElementById("exportBtn");
        if (exportBtn) {
            exportBtn.addEventListener("click", () => this.exportData());
        }
    }

    setupModalEvents() {
        // Add User Modal
        const addUserBtn = document.getElementById("addUserBtn");
        const addUserModal = document.getElementById("addUserModal");
        const closeAddUserModal = document.getElementById("closeAddUserModal");
        const cancelAddUser = document.getElementById("cancelAddUser");
        const saveUser = document.getElementById("saveUser");
        const addUserForm = document.getElementById("addUserForm");

        if (addUserBtn) {
            addUserBtn.addEventListener("click", () => {
                addUserModal.classList.add("show");
            });
        }

        if (closeAddUserModal) {
            closeAddUserModal.addEventListener("click", () => {
                addUserModal.classList.remove("show");
            });
        }

        if (cancelAddUser) {
            cancelAddUser.addEventListener("click", () => {
                addUserModal.classList.remove("show");
            });
        }

        if (saveUser) {
            saveUser.addEventListener("click", () => {
                this.saveNewUser();
            });
        }

        // Close modals on overlay click
        if (addUserModal) {
            addUserModal.addEventListener("click", (e) => {
                if (e.target === addUserModal) {
                    addUserModal.classList.remove("show");
                }
            });
        }

        // Theme variant selectors
        document.querySelectorAll(".theme-variant").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const variant = e.target.dataset.variant;
                this.setThemeVariant(variant);
                
                // Update active state
                document.querySelectorAll(".theme-variant").forEach(b => b.classList.remove("active"));
                e.target.classList.add("active");
            });
        });

        // Chart type buttons
        document.querySelectorAll(".chart-type-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const chartType = e.target.dataset.chartType;
                this.switchChartType(chartType);
            });
        });

        // Tour controls
        const nextTourBtn = document.getElementById("nextTour");
        const prevTourBtn = document.getElementById("prevTour");
        const endTourBtn = document.getElementById("endTour");

        if (nextTourBtn) {
            nextTourBtn.addEventListener("click", () => this.nextTourStep());
        }

        if (prevTourBtn) {
            prevTourBtn.addEventListener("click", () => this.previousTourStep());
        }

        if (endTourBtn) {
            endTourBtn.addEventListener("click", () => this.endTour());
        }

        // Bulk operations
        const selectAllBtn = document.getElementById("selectAll");
        const selectAllCheckbox = document.getElementById("selectAllCheckbox");
        const clearSelectionBtn = document.getElementById("clearSelection");
        const bulkDeleteBtn = document.getElementById("bulkDelete");
        const bulkExportBtn = document.getElementById("bulkExport");
        const bulkArchiveBtn = document.getElementById("bulkArchive");

        if (selectAllBtn) {
            selectAllBtn.addEventListener("click", () => this.selectAllItems());
        }

        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener("change", (e) => {
                if (e.target.checked) {
                    this.selectAllItems();
                } else {
                    this.clearSelection();
                }
            });
        }

        if (clearSelectionBtn) {
            clearSelectionBtn.addEventListener("click", () => this.clearSelection());
        }

        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener("click", () => this.performBulkAction("delete"));
        }

        if (bulkExportBtn) {
            bulkExportBtn.addEventListener("click", () => this.performBulkAction("export"));
        }

        if (bulkArchiveBtn) {
            bulkArchiveBtn.addEventListener("click", () => this.performBulkAction("archive"));
        }
    }

    toggleTheme() {
        this.theme = this.theme === "dark" ? "light" : "dark";
        this.applyTheme();
        localStorage.setItem("theme", this.theme);
    }

    applyTheme() {
        const root = document.documentElement;
        const themeToggle = document.getElementById("themeToggle");
        
        if (this.theme === "light") {
            root.classList.add("light-theme");
            if (themeToggle) themeToggle.classList.add("light");
        } else {
            root.classList.remove("light-theme");
            if (themeToggle) themeToggle.classList.remove("light");
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById("sidebar");
        if (sidebar) {
            this.sidebarOpen = !this.sidebarOpen;
            sidebar.classList.toggle("open", this.sidebarOpen);
        }
    }

    navigateToPage(page) {
        // Hide all pages
        document.querySelectorAll(".page-content").forEach(p => {
            p.style.display = "none";
        });

        // Show selected page
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.style.display = "block";
        }

        // Update navigation
        document.querySelectorAll(".nav-link").forEach(link => {
            link.classList.remove("active");
        });

        const activeLink = document.querySelector(`[data-page="${page}"]`);
        if (activeLink) {
            activeLink.classList.add("active");
        }

        this.currentPage = page;
        
        // Update breadcrumbs
        const pageLabels = {
            "dashboard": "Dashboard",
            "analytics": "Analytics",
            "users": "Users",
            "calendar": "Calendar",
            "settings": "Settings"
        };
        
        if (pageLabels[page]) {
            this.addToBreadcrumbs(pageLabels[page], page);
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener("keydown", (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
                if (e.key === "Escape") {
                    e.target.blur();
                }
                return;
            }

            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case "b":
                        e.preventDefault();
                        this.toggleSidebar();
                        break;
                    case "k":
                        e.preventDefault();
                        this.openCommandPalette();
                        break;
                    case "t":
                        e.preventDefault();
                        this.toggleTheme();
                        break;
                    case ",":
                        e.preventDefault();
                        this.openSettings();
                        break;
                    case "/":
                        e.preventDefault();
                        this.focusSearch();
                        break;
                    case "r":
                        e.preventDefault();
                        this.refreshData();
                        break;
                    case "h":
                        e.preventDefault();
                        this.startTour();
                        break;
                }
            } else if (e.key === "?") {
                e.preventDefault();
                this.toggleShortcutsHelp();
            } else if (e.key === "Escape") {
                // Close any open modals/panels
                if (this.commandPaletteOpen) {
                    this.closeCommandPalette();
                } else if (this.chatOpen) {
                    this.closeAIChat();
                } else if (this.tourActive) {
                    this.endTour();
                }
            }
        });
    }

    focusSearch() {
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
            searchInput.focus();
        }
    }

    openSettings() {
        const settingsPanel = document.getElementById("settingsPanel");
        if (settingsPanel) {
            settingsPanel.classList.add("open");
        }
    }

    toggleShortcutsHelp() {
        const shortcutsHelp = document.getElementById("shortcutsHelp");
        if (shortcutsHelp) {
            shortcutsHelp.classList.toggle("show");
            setTimeout(() => {
                shortcutsHelp.classList.remove("show");
            }, 5000);
        }
    }

    initializeChart() {
        const ctx = document.getElementById("performanceChart");
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }

        // Generate sample data based on chart type
        let chartConfig;
        
        switch (this.currentChartType) {
            case "bar":
                chartConfig = this.getBarChartConfig();
                break;
            case "pie":
                chartConfig = this.getPieChartConfig();
                break;
            case "doughnut":
                chartConfig = this.getDoughnutChartConfig();
                break;
            case "radar":
                chartConfig = this.getRadarChartConfig();
                break;
            case "line":
            default:
                chartConfig = this.getLineChartConfig();
                break;
        }

        this.chart = new Chart(ctx, chartConfig);
    }

    getLineChartConfig() {
        const labels = [];
        const data = [];
        const now = new Date();
        
        for (let i = 23; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60 * 60 * 1000);
            labels.push(time.getHours() + ":00");
            data.push(Math.floor(Math.random() * 40) + 60);
        }

        return {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: "System Performance (%)",
                    data: data,
                    borderColor: "var(--primary-color)",
                    backgroundColor: "rgba(79, 70, 229, 0.1)",
                    tension: 0.4,
                    fill: true
                }]
            },
            options: this.getChartOptions()
        };
    }

    getBarChartConfig() {
        return {
            type: "bar",
            data: {
                labels: ["CPU", "Memory", "Disk", "Network", "Database", "Cache"],
                datasets: [{
                    label: "Resource Usage (%)",
                    data: [75, 82, 45, 67, 91, 38],
                    backgroundColor: [
                        "rgba(79, 70, 229, 0.8)",
                        "rgba(34, 197, 94, 0.8)",
                        "rgba(251, 191, 36, 0.8)",
                        "rgba(239, 68, 68, 0.8)",
                        "rgba(168, 85, 247, 0.8)",
                        "rgba(6, 182, 212, 0.8)"
                    ],
                    borderColor: [
                        "rgb(79, 70, 229)",
                        "rgb(34, 197, 94)",
                        "rgb(251, 191, 36)",
                        "rgb(239, 68, 68)",
                        "rgb(168, 85, 247)",
                        "rgb(6, 182, 212)"
                    ],
                    borderWidth: 1
                }]
            },
            options: this.getChartOptions()
        };
    }

    getPieChartConfig() {
        return {
            type: "pie",
            data: {
                labels: ["Active Users", "Pending", "Inactive", "Suspended"],
                datasets: [{
                    data: [342, 23, 45, 12],
                    backgroundColor: [
                        "rgba(34, 197, 94, 0.8)",
                        "rgba(251, 191, 36, 0.8)",
                        "rgba(156, 163, 175, 0.8)",
                        "rgba(239, 68, 68, 0.8)"
                    ],
                    borderColor: [
                        "rgb(34, 197, 94)",
                        "rgb(251, 191, 36)",
                        "rgb(156, 163, 175)",
                        "rgb(239, 68, 68)"
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            color: "#cbd5e1",
                            padding: 20
                        }
                    }
                }
            }
        };
    }

    getDoughnutChartConfig() {
        return {
            type: "doughnut",
            data: {
                labels: ["Completed", "In Progress", "Pending", "Failed"],
                datasets: [{
                    data: [156, 34, 89, 12],
                    backgroundColor: [
                        "rgba(34, 197, 94, 0.8)",
                        "rgba(79, 70, 229, 0.8)",
                        "rgba(251, 191, 36, 0.8)",
                        "rgba(239, 68, 68, 0.8)"
                    ],
                    borderColor: [
                        "rgb(34, 197, 94)",
                        "rgb(79, 70, 229)",
                        "rgb(251, 191, 36)",
                        "rgb(239, 68, 68)"
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "60%",
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            color: "#cbd5e1",
                            padding: 20
                        }
                    }
                }
            }
        };
    }

    getRadarChartConfig() {
        return {
            type: "radar",
            data: {
                labels: ["Performance", "Security", "Reliability", "Scalability", "Usability", "Efficiency"],
                datasets: [{
                    label: "Current Score",
                    data: [85, 92, 78, 88, 91, 83],
                    borderColor: "var(--primary-color)",
                    backgroundColor: "rgba(79, 70, 229, 0.2)",
                    borderWidth: 2,
                    pointBackgroundColor: "var(--primary-color)",
                    pointBorderColor: "#fff",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "var(--primary-color)"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: {
                            color: "rgba(100, 116, 139, 0.3)"
                        },
                        grid: {
                            color: "rgba(100, 116, 139, 0.3)"
                        },
                        pointLabels: {
                            color: "#cbd5e1"
                        },
                        ticks: {
                            color: "#64748b",
                            backdropColor: "transparent"
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: "#cbd5e1"
                        }
                    }
                }
            }
        };
    }

    getChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: "#cbd5e1"
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: "#64748b"
                    },
                    grid: {
                        color: "rgba(100, 116, 139, 0.1)"
                    }
                },
                y: {
                    ticks: {
                        color: "#64748b"
                    },
                    grid: {
                        color: "rgba(100, 116, 139, 0.1)"
                    }
                }
            }
        };
    }

    initializeCalendar() {
        const calendar = document.getElementById("calendar");
        if (calendar) {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
            
            this.renderCalendar(calendar, year, month);
        }
    }

    renderCalendar(container, year, month) {
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        container.innerHTML = `
            <div class="calendar-header">
                <button class="calendar-nav" onclick="dashboard.previousMonth()">&lt;</button>
                <div class="calendar-title">${monthNames[month]} ${year}</div>
                <button class="calendar-nav" onclick="dashboard.nextMonth()">&gt;</button>
            </div>
            <div class="calendar-grid">
                ${dayNames.map(day => `<div class="calendar-day-header">${day}</div>`).join("")}
                ${Array.from({length: firstDay}, () => "<div class=\"calendar-day other-month\"></div>").join("")}
                ${Array.from({length: daysInMonth}, (_, i) => {
                    const day = i + 1;
                    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
                    return `<div class="calendar-day ${isToday ? "today" : ""}">${day}</div>`;
                }).join("")}
            </div>
        `;
        
        this.currentCalendarYear = year;
        this.currentCalendarMonth = month;
    }

    previousMonth() {
        if (this.currentCalendarMonth === 0) {
            this.currentCalendarMonth = 11;
            this.currentCalendarYear--;
        } else {
            this.currentCalendarMonth--;
        }
        this.renderCalendar(document.getElementById("calendar"), this.currentCalendarYear, this.currentCalendarMonth);
    }

    nextMonth() {
        if (this.currentCalendarMonth === 11) {
            this.currentCalendarMonth = 0;
            this.currentCalendarYear++;
        } else {
            this.currentCalendarMonth++;
        }
        this.renderCalendar(document.getElementById("calendar"), this.currentCalendarYear, this.currentCalendarMonth);
    }

    renderActivityTable() {
        const tbody = document.getElementById("activityTableBody");
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        tbody.innerHTML = pageData.map(item => `
            <tr>
                <td>
                    <input type="checkbox" data-user="${item.user}" 
                           ${this.selectedItems.has(item.user) ? "checked" : ""}
                           onchange="dashboard.toggleItemSelection('${item.user}')">
                </td>
                <td>${item.user}</td>
                <td>${item.action}</td>
                <td><span class="table-status-${item.status}">${this.capitalizeFirst(item.status)}</span></td>
                <td>${item.time}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="dashboard.viewDetails('${item.user}')">View</button>
                </td>
            </tr>
        `).join("");

        this.updatePagination();
    }

    filterTable() {
        const statusFilter = document.getElementById("statusFilter").value;
        const typeFilter = document.getElementById("typeFilter").value;

        this.filteredData = this.activityData.filter(item => {
            const statusMatch = !statusFilter || item.status === statusFilter;
            const typeMatch = !typeFilter || item.type === typeFilter;
            return statusMatch && typeMatch;
        });

        this.currentPage = 1;
        this.renderActivityTable();
    }

    changePage(direction) {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        const newPage = this.currentPage + direction;

        if (newPage >= 1 && newPage <= totalPages) {
            this.currentPage = newPage;
            this.renderActivityTable();
        }
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        const pageInfo = document.getElementById("pageInfo");
        const prevBtn = document.getElementById("prevPage");
        const nextBtn = document.getElementById("nextPage");

        if (pageInfo) {
            pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
        }

        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 1;
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentPage === totalPages;
        }
    }

    startRealTimeUpdates() {
        // Update stats every 5 seconds
        setInterval(() => {
            this.updateStats();
        }, 5000);

        // Update server load every 3 seconds
        setInterval(() => {
            this.updateServerLoad();
        }, 3000);
    }

    updateStats() {
        const totalUsers = document.getElementById("totalUsers");
        const revenue = document.getElementById("revenue");

        if (totalUsers) {
            const current = parseInt(totalUsers.textContent.replace(/,/g, ""));
            const change = Math.floor(Math.random() * 20) - 10;
            const newValue = Math.max(0, current + change);
            totalUsers.textContent = newValue.toLocaleString();
        }

        if (revenue) {
            const current = parseInt(revenue.textContent.replace(/[$,]/g, ""));
            const change = Math.floor(Math.random() * 1000) - 500;
            const newValue = Math.max(0, current + change);
            revenue.textContent = "$" + newValue.toLocaleString();
        }
    }

    updateServerLoad() {
        const serverLoad = document.getElementById("serverLoad");
        if (serverLoad) {
            const newLoad = Math.floor(Math.random() * 30) + 50;
            serverLoad.textContent = newLoad + "%";
        }
    }

    setupSearch() {
        const searchInput = document.getElementById("searchInput");
        const searchResults = document.getElementById("searchResults");

        if (searchInput && searchResults) {
            searchInput.addEventListener("input", (e) => {
                const query = e.target.value.toLowerCase();
                
                if (query.length > 0) {
                    const results = this.performSearch(query);
                    this.displaySearchResults(results, searchResults);
                    searchResults.classList.add("show");
                } else {
                    searchResults.classList.remove("show");
                }
            });

            searchInput.addEventListener("blur", () => {
                setTimeout(() => {
                    searchResults.classList.remove("show");
                }, 200);
            });
        }
    }

    performSearch(query) {
        const searchData = [
            { title: "Dashboard", type: "page", action: () => this.navigateToPage("dashboard") },
            { title: "Users", type: "page", action: () => this.navigateToPage("users") },
            { title: "Calendar", type: "page", action: () => this.navigateToPage("calendar") },
            { title: "Settings", type: "page", action: () => this.openSettings() },
            { title: "Add User", type: "action", action: () => this.openAddUserModal() },
            { title: "Export Data", type: "action", action: () => this.exportData() },
            { title: "System Status", type: "info", action: () => this.showSystemStatus() }
        ];

        return searchData.filter(item => 
            item.title.toLowerCase().includes(query)
        ).slice(0, 5);
    }

    displaySearchResults(results, container) {
        container.innerHTML = results.map(result => `
            <div class="search-result-item" onclick="dashboard.executeSearchAction('${result.title}')">
                <strong>${result.title}</strong>
                <small style="color: var(--text-muted);">${result.type}</small>
            </div>
        `).join("") || "<div class=\"search-result-item\">No results found</div>";
    }

    executeSearchAction(title) {
        const searchData = {
            "Dashboard": () => this.navigateToPage("dashboard"),
            "Users": () => this.navigateToPage("users"),
            "Calendar": () => this.navigateToPage("calendar"),
            "Settings": () => this.openSettings(),
            "Add User": () => this.openAddUserModal(),
            "Export Data": () => this.exportData(),
            "System Status": () => this.showSystemStatus()
        };

        const action = searchData[title];
        if (action) {
            action();
            document.getElementById("searchInput").value = "";
            document.getElementById("searchResults").classList.remove("show");
        }
    }

    setupFileUpload() {
        const fileUpload = document.getElementById("fileUpload");
        const fileInput = document.getElementById("fileInput");

        if (fileUpload && fileInput) {
            fileUpload.addEventListener("click", () => {
                fileInput.click();
            });

            fileUpload.addEventListener("dragover", (e) => {
                e.preventDefault();
                fileUpload.classList.add("dragover");
            });

            fileUpload.addEventListener("dragleave", () => {
                fileUpload.classList.remove("dragover");
            });

            fileUpload.addEventListener("drop", (e) => {
                e.preventDefault();
                fileUpload.classList.remove("dragover");
                this.handleFiles(e.dataTransfer.files);
            });

            fileInput.addEventListener("change", (e) => {
                this.handleFiles(e.target.files);
            });
        }
    }

    handleFiles(files) {
        Array.from(files).forEach(file => {
            this.showNotification("success", "File Uploaded", `${file.name} has been uploaded successfully.`);
        });
    }

    showNotifications() {
        this.showNotification("info", "New Message", "You have 3 unread messages.");
        this.showNotification("warning", "System Update", "A system update is available.");
        this.showNotification("success", "Backup Complete", "Daily backup completed successfully.");
    }

    showNotification(type, title, message) {
        const container = document.getElementById("notificationContainer");
        if (!container) return;

        const notification = document.createElement("div");
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-header">
                <div class="notification-title">${title}</div>
                <button class="notification-close">&times;</button>
            </div>
            <div class="notification-message">${message}</div>
        `;

        container.appendChild(notification);

        // Show notification
        setTimeout(() => {
            notification.classList.add("show");
        }, 100);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove("show");
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);

        // Manual close
        const closeBtn = notification.querySelector(".notification-close");
        closeBtn.addEventListener("click", () => {
            notification.classList.remove("show");
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
    }

    saveNewUser() {
        const form = document.getElementById("addUserForm");
        const formData = new FormData(form);
        const userData = Object.fromEntries(formData);

        // Simulate saving user
        this.showNotification("success", "User Added", `${userData.fullName} has been added successfully.`);
        
        // Close modal
        document.getElementById("addUserModal").classList.remove("show");
        
        // Reset form
        form.reset();
    }

    openAddUserModal() {
        document.getElementById("addUserModal").classList.add("show");
    }

    refreshData() {
        this.showNotification("info", "Refreshing", "Refreshing dashboard data...");
        
        // Simulate data refresh
        setTimeout(() => {
            this.renderActivityTable();
            this.updateStats();
            this.showNotification("success", "Refreshed", "Dashboard data has been updated.");
        }, 1000);
    }

    exportData() {
        const csvContent = this.convertToCSV(this.filteredData);
        this.downloadCSV(csvContent, "activity-data.csv");
        this.showNotification("success", "Export Complete", "Data has been exported successfully.");
    }

    convertToCSV(data) {
        const headers = ["User", "Action", "Status", "Time", "Type"];
        const rows = data.map(item => [
            item.user,
            item.action,
            item.status,
            item.time,
            item.type
        ]);

        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(","))
            .join("\n");
    }

    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    viewDetails(user) {
        this.showNotification("info", "User Details", `Viewing details for ${user}`);
    }

    showSystemStatus() {
        this.navigateToPage("dashboard");
        // Scroll to system status card
        setTimeout(() => {
            const statusCard = document.querySelector(".status-list").closest(".card");
            if (statusCard) {
                statusCard.scrollIntoView({ behavior: "smooth" });
                statusCard.style.animation = "pulse 1s ease-in-out";
            }
        }, 300);
    }

    loadUserPreferences() {
        // Load saved preferences
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme) {
            this.theme = savedTheme;
            this.applyTheme();
        }

        // Load other preferences
        const refreshInterval = localStorage.getItem("refreshInterval") || "60";
        const autoRefresh = document.getElementById("refreshInterval");
        if (autoRefresh) {
            autoRefresh.value = refreshInterval;
        }
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Command Palette Implementation
    initializeCommandPalette() {
        const commandPalette = document.getElementById("commandPalette");
        const commandInput = document.getElementById("commandInput");
        const commandResults = document.getElementById("commandResults");

        if (commandInput) {
            commandInput.addEventListener("input", (e) => {
                this.filterCommands(e.target.value);
            });

            commandInput.addEventListener("keydown", (e) => {
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                    e.preventDefault();
                    this.navigateCommandResults(e.key);
                } else if (e.key === "Enter") {
                    e.preventDefault();
                    this.executeSelectedCommand();
                } else if (e.key === "Escape") {
                    this.closeCommandPalette();
                }
            });
        }

        // Close on click outside
        if (commandPalette) {
            commandPalette.addEventListener("click", (e) => {
                if (e.target === commandPalette) {
                    this.closeCommandPalette();
                }
            });
        }
    }

    openCommandPalette() {
        const commandPalette = document.getElementById("commandPalette");
        const commandInput = document.getElementById("commandInput");
        
        if (commandPalette && commandInput) {
            this.commandPaletteOpen = true;
            commandPalette.classList.add("show");
            commandInput.value = "";
            commandInput.focus();
            this.renderCommands(this.commands);
        }
    }

    closeCommandPalette() {
        const commandPalette = document.getElementById("commandPalette");
        
        if (commandPalette) {
            this.commandPaletteOpen = false;
            commandPalette.classList.remove("show");
            this.selectedCommandIndex = -1;
        }
    }

    filterCommands(query) {
        const filtered = this.commands.filter(cmd => 
            cmd.label.toLowerCase().includes(query.toLowerCase()) ||
            cmd.id.toLowerCase().includes(query.toLowerCase())
        );
        this.renderCommands(filtered);
    }

    renderCommands(commands) {
        const commandResults = document.getElementById("commandResults");
        if (!commandResults) return;

        commandResults.innerHTML = commands.map((cmd, index) => `
            <div class="command-item ${index === 0 ? "selected" : ""}" data-command="${cmd.id}">
                <span class="command-icon">${cmd.icon}</span>
                <span class="command-label">${cmd.label}</span>
            </div>
        `).join("");

        this.selectedCommandIndex = commands.length > 0 ? 0 : -1;

        // Add click handlers
        commandResults.querySelectorAll(".command-item").forEach((item, index) => {
            item.addEventListener("click", () => {
                this.selectedCommandIndex = index;
                this.executeSelectedCommand();
            });
        });
    }

    navigateCommandResults(direction) {
        const items = document.querySelectorAll(".command-item");
        if (items.length === 0) return;

        items[this.selectedCommandIndex]?.classList.remove("selected");

        if (direction === "ArrowDown") {
            this.selectedCommandIndex = (this.selectedCommandIndex + 1) % items.length;
        } else {
            this.selectedCommandIndex = this.selectedCommandIndex <= 0 ? items.length - 1 : this.selectedCommandIndex - 1;
        }

        items[this.selectedCommandIndex]?.classList.add("selected");
        items[this.selectedCommandIndex]?.scrollIntoView({ block: "nearest" });
    }

    executeSelectedCommand() {
        const selectedItem = document.querySelector(".command-item.selected");
        if (!selectedItem) return;

        const commandId = selectedItem.dataset.command;
        const command = this.commands.find(cmd => cmd.id === commandId);
        
        if (command) {
            this.closeCommandPalette();
            command.action();
        }
    }

    // Theme Variant Implementation
    setThemeVariant(variant) {
        this.themeVariant = variant;
        localStorage.setItem("themeVariant", variant);
        this.applyThemeVariant();
    }

    applyThemeVariant() {
        const root = document.documentElement;
        const variants = {
            default: { primary: "#4f46e5", secondary: "#7c3aed" },
            blue: { primary: "#2563eb", secondary: "#0ea5e9" },
            purple: { primary: "#7c3aed", secondary: "#a855f7" },
            green: { primary: "#059669", secondary: "#10b981" },
            orange: { primary: "#ea580c", secondary: "#f97316" },
            pink: { primary: "#db2777", secondary: "#ec4899" },
            indigo: { primary: "#4338ca", secondary: "#6366f1" }
        };

        const colors = variants[this.themeVariant] || variants.default;
        root.style.setProperty("--primary-color", colors.primary);
        root.style.setProperty("--secondary-color", colors.secondary);
    }

    // Tour/Onboarding Implementation
    initializeTour() {
        const startTourBtn = document.getElementById("startTour");
        if (startTourBtn) {
            startTourBtn.addEventListener("click", () => this.startTour());
        }

        // Tour navigation buttons
        const nextTourBtn = document.getElementById("nextTour");
        const prevTourBtn = document.getElementById("prevTour");
        const endTourBtn = document.getElementById("endTour");

        if (nextTourBtn) {
            nextTourBtn.addEventListener("click", () => this.nextTourStep());
        }

        if (prevTourBtn) {
            prevTourBtn.addEventListener("click", () => this.previousTourStep());
        }

        if (endTourBtn) {
            endTourBtn.addEventListener("click", () => this.endTour());
        }

        // Add tour button to onboarding modal
        const startTourFromModal = document.getElementById("startTourFromModal");
        if (startTourFromModal) {
            startTourFromModal.addEventListener("click", () => {
                // Close onboarding modal first
                const modal = document.getElementById("onboardingModal");
                if (modal) modal.style.display = "none";
                // Start tour
                this.startTour();
            });
        }
    }

    startTour() {
        console.log("Starting tour...");
        this.tourActive = true;
        this.currentTourStep = 0;
        this.showTourStep();
    }

    showTourStep() {
        console.log("showTourStep called, step:", this.currentTourStep);
        
        const tourOverlay = document.getElementById("tourOverlay");
        const tourTooltip = document.getElementById("tourTooltip");
        const tourTitle = document.getElementById("tourTitle");
        const tourContent = document.getElementById("tourContent");
        const tourProgress = document.getElementById("tourProgress");
        const tourStepCount = document.getElementById("tourStepCount");

        console.log("Tour elements found:", {
            tourOverlay: !!tourOverlay,
            tourTooltip: !!tourTooltip,
            tourTitle: !!tourTitle,
            tourContent: !!tourContent
        });

        if (!tourOverlay || !tourTooltip) {
            console.error("Tour elements not found");
            return;
        }

        const step = this.tourSteps[this.currentTourStep];
        console.log("Current step:", step);
        
        const target = document.querySelector(step.target);
        console.log("Target element found:", !!target, step.target);

        if (!target) {
            console.warn(`Tour target not found: ${step.target}`);
            this.nextTourStep();
            return;
        }

        // Show overlay and tooltip
        console.log("Showing tour overlay and tooltip");
        tourOverlay.style.display = "block";
        tourTooltip.style.display = "block";

        // Update content
        if (tourTitle) tourTitle.textContent = step.title;
        if (tourContent) tourContent.textContent = step.content;
        if (tourProgress) tourProgress.style.width = `${((this.currentTourStep + 1) / this.tourSteps.length) * 100}%`;
        if (tourStepCount) tourStepCount.textContent = `${this.currentTourStep + 1} of ${this.tourSteps.length}`;

        // Position tooltip near target
        const rect = target.getBoundingClientRect();
        const tooltipRect = tourTooltip.getBoundingClientRect();
        
        let top = rect.bottom + 20;
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

        // Adjust if tooltip goes off screen
        if (left < 20) left = 20;
        if (left + tooltipRect.width > window.innerWidth - 20) {
            left = window.innerWidth - tooltipRect.width - 20;
        }
        if (top + tooltipRect.height > window.innerHeight - 20) {
            top = rect.top - tooltipRect.height - 20;
        }

        console.log("Positioning tooltip at:", { top, left });
        tourTooltip.style.top = `${top}px`;
        tourTooltip.style.left = `${left}px`;

        // Remove existing spotlight
        const existingSpotlight = document.querySelector(".tour-spotlight");
        if (existingSpotlight) {
            existingSpotlight.remove();
        }

        // Create spotlight effect
        const spotlight = document.createElement("div");
        spotlight.className = "tour-spotlight";
        spotlight.style.top = `${rect.top - 10}px`;
        spotlight.style.left = `${rect.left - 10}px`;
        spotlight.style.width = `${rect.width + 20}px`;
        spotlight.style.height = `${rect.height + 20}px`;
        tourOverlay.appendChild(spotlight);

        console.log(`Tour step ${this.currentTourStep + 1}: ${step.title}`);
    }

    nextTourStep() {
        // Remove existing spotlight
        const existingSpotlight = document.querySelector(".tour-spotlight");
        if (existingSpotlight) {
            existingSpotlight.remove();
        }

        if (this.currentTourStep < this.tourSteps.length - 1) {
            this.currentTourStep++;
            this.showTourStep();
        } else {
            this.endTour();
        }
    }

    previousTourStep() {
        // Remove existing spotlight
        const existingSpotlight = document.querySelector(".tour-spotlight");
        if (existingSpotlight) {
            existingSpotlight.remove();
        }

        if (this.currentTourStep > 0) {
            this.currentTourStep--;
            this.showTourStep();
        }
    }

    endTour() {
        this.tourActive = false;
        const tourOverlay = document.getElementById("tourOverlay");
        const tourTooltip = document.getElementById("tourTooltip");
        
        if (tourOverlay) tourOverlay.style.display = "none";
        if (tourTooltip) tourTooltip.style.display = "none";

        // Remove spotlight
        const existingSpotlight = document.querySelector(".tour-spotlight");
        if (existingSpotlight) {
            existingSpotlight.remove();
        }

        this.showNotification("success", "Tour Complete", "You've completed the dashboard tour!");
    }

    // Widget Customization Implementation
    initializeWidgetCustomization() {
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const widgets = document.querySelectorAll(".widget-draggable");
        const dropZones = document.querySelectorAll(".widget-drop-zone");

        widgets.forEach(widget => {
            widget.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("text/plain", widget.dataset.widgetId);
                widget.classList.add("dragging");
            });

            widget.addEventListener("dragend", () => {
                widget.classList.remove("dragging");
            });
        });

        dropZones.forEach(zone => {
            zone.addEventListener("dragover", (e) => {
                e.preventDefault();
                zone.classList.add("drag-over");
            });

            zone.addEventListener("dragleave", () => {
                zone.classList.remove("drag-over");
            });

            zone.addEventListener("drop", (e) => {
                e.preventDefault();
                zone.classList.remove("drag-over");
                
                const widgetId = e.dataTransfer.getData("text/plain");
                const newPosition = parseInt(zone.dataset.position);
                
                this.moveWidget(widgetId, newPosition);
            });
        });
    }

    moveWidget(widgetId, newPosition) {
        const widget = this.widgetLayout.find(w => w.id === widgetId);
        if (widget) {
            widget.position = newPosition;
            this.saveWidgetLayout();
            this.loadWidgetLayout();
            this.showNotification("success", "Widget Moved", "Widget repositioned successfully!");
        }
    }

    saveWidgetLayout() {
        localStorage.setItem("widgetLayout", JSON.stringify(this.widgetLayout));
    }

    loadWidgetLayout() {
        // This would reorganize the actual DOM elements based on saved layout
        // For now, we'll just show a notification
        console.log("Widget layout loaded:", this.widgetLayout);
    }

    // Chart Type Switching Implementation
    switchChartType(type) {
        this.currentChartType = type;
        if (this.chart) {
            this.chart.destroy();
        }
        this.initializeChart();
        
        // Update active button
        document.querySelectorAll(".chart-type-btn").forEach(btn => {
            btn.classList.remove("active");
        });
        document.querySelector(`[data-chart-type="${type}"]`)?.classList.add("active");
    }

    // Favorites Implementation
    initializeFavorites() {
        this.renderFavorites();
    }

    addToFavorites(item) {
        if (!this.favorites.find(fav => fav.id === item.id)) {
            this.favorites.push(item);
            this.saveFavorites();
            this.renderFavorites();
            this.showNotification("success", "Added to Favorites", `${item.label} added to favorites!`);
        }
    }

    removeFromFavorites(itemId) {
        this.favorites = this.favorites.filter(fav => fav.id !== itemId);
        this.saveFavorites();
        this.renderFavorites();
        this.showNotification("info", "Removed from Favorites", "Item removed from favorites");
    }

    saveFavorites() {
        localStorage.setItem("favorites", JSON.stringify(this.favorites));
    }

    renderFavorites() {
        const favoritesList = document.getElementById("favoritesList");
        if (!favoritesList) return;

        favoritesList.innerHTML = this.favorites.map(fav => `
            <div class="favorite-item" onclick="dashboard.navigateToPage('${fav.page || "dashboard"}')">
                <span class="favorite-icon">${fav.icon || "⭐"}</span>
                <span class="favorite-label">${fav.label}</span>
                <button class="btn-icon" onclick="event.stopPropagation(); dashboard.removeFromFavorites('${fav.id}')" title="Remove from favorites">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join("");
    }

    // Breadcrumb Implementation
    updateBreadcrumbs() {
        const breadcrumbContainer = document.getElementById("breadcrumbContainer");
        if (!breadcrumbContainer) return;

        breadcrumbContainer.innerHTML = this.breadcrumbs.map((crumb, index) => `
            <span class="breadcrumb-item ${index === this.breadcrumbs.length - 1 ? "active" : ""}" 
                  ${index < this.breadcrumbs.length - 1 ? `onclick="dashboard.navigateToPage('${crumb.page}')"` : ""}>
                ${crumb.label}
            </span>
            ${index < this.breadcrumbs.length - 1 ? "<span class=\"breadcrumb-separator\">/</span>" : ""}
        `).join("");
    }

    addToBreadcrumbs(label, page) {
        // Remove any existing breadcrumb for this page
        this.breadcrumbs = this.breadcrumbs.filter(crumb => crumb.page !== page);
        
        // Add new breadcrumb
        this.breadcrumbs.push({ label, page });
        
        // Limit breadcrumbs to 5 items
        if (this.breadcrumbs.length > 5) {
            this.breadcrumbs = this.breadcrumbs.slice(-5);
        }
        
        this.updateBreadcrumbs();
    }

    // Bulk Operations Implementation
    toggleItemSelection(itemId) {
        if (this.selectedItems.has(itemId)) {
            this.selectedItems.delete(itemId);
        } else {
            this.selectedItems.add(itemId);
        }
        
        this.updateBulkOperationsBar();
        this.updateSelectionUI();
    }

    selectAllItems() {
        this.filteredData.forEach(item => {
            this.selectedItems.add(item.user);
        });
        this.updateBulkOperationsBar();
        this.updateSelectionUI();
    }

    clearSelection() {
        this.selectedItems.clear();
        this.updateBulkOperationsBar();
        this.updateSelectionUI();
    }

    updateBulkOperationsBar() {
        const bulkBar = document.getElementById("bulkOperationsBar");
        const selectedCount = document.getElementById("selectedCount");
        
        if (bulkBar && selectedCount) {
            if (this.selectedItems.size > 0) {
                bulkBar.classList.add("show");
                selectedCount.textContent = this.selectedItems.size;
            } else {
                bulkBar.classList.remove("show");
            }
        }
    }

    updateSelectionUI() {
        // Update checkboxes in table
        this.filteredData.forEach(item => {
            const checkbox = document.querySelector(`input[data-user="${item.user}"]`);
            if (checkbox) {
                checkbox.checked = this.selectedItems.has(item.user);
            }
        });

        // Update select all checkbox
        const selectAllCheckbox = document.getElementById("selectAllCheckbox");
        if (selectAllCheckbox) {
            const totalItems = this.filteredData.length;
            const selectedItems = this.selectedItems.size;
            
            if (selectedItems === 0) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = false;
            } else if (selectedItems === totalItems) {
                selectAllCheckbox.checked = true;
                selectAllCheckbox.indeterminate = false;
            } else {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = true;
            }
        }
    }

    performBulkAction(action) {
        const selectedItems = Array.from(this.selectedItems);
        
        switch (action) {
            case "delete":
                this.showNotification("warning", "Bulk Delete", `Would delete ${selectedItems.length} items`);
                break;
            case "export":
                this.showNotification("info", "Bulk Export", `Would export ${selectedItems.length} items`);
                break;
            case "archive":
                this.showNotification("info", "Bulk Archive", `Would archive ${selectedItems.length} items`);
                break;
        }
        
        this.clearSelection();
    }

    // Offline/PWA Implementation
    initializeOfflineDetection() {
        window.addEventListener("online", () => {
            this.isOnline = true;
            this.updateOfflineIndicator();
            this.showNotification("success", "Connection Restored", "You are back online!");
        });

        window.addEventListener("offline", () => {
            this.isOnline = false;
            this.updateOfflineIndicator();
            this.showNotification("warning", "Connection Lost", "You are now offline. Some features may be limited.");
        });

        this.updateOfflineIndicator();
    }

    updateOfflineIndicator() {
        const indicator = document.getElementById("offlineIndicator");
        if (indicator) {
            if (this.isOnline) {
                indicator.classList.remove("show");
            } else {
                indicator.classList.add("show");
            }
        }
    }

    // AI Chat Implementation
    initializeAIChat() {
        const aiChatBtn = document.getElementById("aiChatBtn");
        const aiChatPanel = document.getElementById("aiChatPanel");
        const aiChatInput = document.getElementById("aiChatInput");
        const aiSendBtn = document.getElementById("aiSendBtn");

        if (aiChatBtn) {
            aiChatBtn.addEventListener("click", () => this.toggleAIChat());
        }

        if (aiSendBtn) {
            aiSendBtn.addEventListener("click", () => this.sendAIMessage());
        }

        if (aiChatInput) {
            aiChatInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    this.sendAIMessage();
                }
            });
        }

        // Close chat when clicking outside
        if (aiChatPanel) {
            document.addEventListener("click", (e) => {
                if (this.chatOpen && !aiChatPanel.contains(e.target) && !aiChatBtn.contains(e.target)) {
                    this.closeAIChat();
                }
            });
        }
    }

    toggleAIChat() {
        if (this.chatOpen) {
            this.closeAIChat();
        } else {
            this.openAIChat();
        }
    }

    openAIChat() {
        const aiChatPanel = document.getElementById("aiChatPanel");
        if (aiChatPanel) {
            this.chatOpen = true;
            aiChatPanel.classList.add("show");
            document.getElementById("aiChatInput")?.focus();
        }
    }

    closeAIChat() {
        const aiChatPanel = document.getElementById("aiChatPanel");
        if (aiChatPanel) {
            this.chatOpen = false;
            aiChatPanel.classList.remove("show");
        }
    }

    sendAIMessage() {
        const aiChatInput = document.getElementById("aiChatInput");
        const aiChatMessages = document.getElementById("aiChatMessages");
        
        if (!aiChatInput || !aiChatMessages) return;
        
        const message = aiChatInput.value.trim();
        if (!message) return;

        // Add user message
        this.addChatMessage("user", message);
        aiChatInput.value = "";

        // Simulate AI response
        setTimeout(() => {
            const response = this.generateAIResponse(message);
            this.addChatMessage("ai", response);
        }, 1000);
    }

    addChatMessage(sender, message) {
        const aiChatMessages = document.getElementById("aiChatMessages");
        if (!aiChatMessages) return;

        const messageDiv = document.createElement("div");
        messageDiv.className = `chat-message ${sender}`;
        messageDiv.innerHTML = `
            <div class="message-content">${message}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;

        aiChatMessages.appendChild(messageDiv);
        aiChatMessages.scrollTop = aiChatMessages.scrollHeight;

        this.chatHistory.push({ sender, message, timestamp: new Date() });
    }

    generateAIResponse(userMessage) {
        const responses = {
            "hello": "Hello! I'm your AI assistant. How can I help you with the dashboard today?",
            "help": "I can help you navigate the dashboard, explain features, analyze data, and answer questions about your system.",
            "stats": "Your dashboard shows strong performance metrics. User engagement is up 15% this month!",
            "users": "You currently have 1,234 active users. Would you like me to show you user activity patterns?",
            "analytics": "Your analytics show positive trends across all key metrics. Revenue is up 23% compared to last month.",
            "default": "That's an interesting question! As an AI assistant, I can help you with dashboard navigation, data analysis, and system insights. What specific area would you like to explore?"
        };

        const lowerMessage = userMessage.toLowerCase();
        
        for (const [key, response] of Object.entries(responses)) {
            if (lowerMessage.includes(key)) {
                return response;
            }
        }
        
        return responses.default;
    }

    // Additional Helper Methods

    refreshData() {
        this.showNotification("info", "Refreshing", "Updating dashboard data...");
        
        // Simulate data refresh
        setTimeout(() => {
            this.renderActivityTable();
            this.updateStats();
            this.showNotification("success", "Data Updated", "Dashboard has been refreshed!");
        }, 1500);
    }

    logout() {
        this.showNotification("info", "Signing Out", "Goodbye! You have been signed out.");
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }

    showHelp() {
        this.startTour();
    }

    openSettings() {
        const settingsPanel = document.getElementById("settingsPanel");
        if (settingsPanel) {
            settingsPanel.classList.add("show");
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    window.dashboard = new AetheronDashboard();
    
    // Add welcome message
    setTimeout(() => {
        dashboard.showNotification("success", "Welcome!", "Welcome to Aetheron Dashboard Premium Edition!");
    }, 1000);
});

// Global functions for HTML onclick events
function openModal(modalId) {
    document.getElementById(modalId).classList.add("show");
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove("show");
}
