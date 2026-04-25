document.addEventListener('DOMContentLoaded', () => {
    // Generar fondo de estrellas
    const starsContainer = document.getElementById('stars-container');
    if(starsContainer) {
        for (let i = 0; i < 150; i++) {
            const star = document.createElement('div');
            star.classList.add('star');
            const size = Math.random() * 2 + 1;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.left = `${Math.random() * 100}vw`;
            star.style.top = `${Math.random() * 100}vh`;
            star.style.animationDelay = `${Math.random() * 5}s`;
            starsContainer.appendChild(star);
        }
    }

    // Referencias DOM
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const adminUserEmail = document.getElementById('admin-user-email');
    const btnLogout = document.getElementById('btn-logout');

    const sorteoForm = document.getElementById('sorteo-form');
    const btnPausar = document.getElementById('btn-pausar');
    const btnFinalizar = document.getElementById('btn-finalizar');
    const badgeStatus = document.getElementById('sorteo-status-badge');
    const adminCountdown = document.getElementById('admin-countdown');

    const tbody = document.querySelector('#participantes-table tbody');
    const countSpan = document.getElementById('participantes-count');
    const btnExportCSV = document.getElementById('btn-export-csv');
    const btnElegirGanador = document.getElementById('btn-elegir-ganador');
    const winnerResult = document.getElementById('winner-result');

    let currentSorteo = null;
    let countdownInterval = null;
    let realtimeSubscription = null;

    // Verificar sesión al cargar
    checkSession();

    async function checkSession() {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (session) {
            showDashboard(session.user);
        } else {
            showLogin();
        }
    }

    // Evento Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            loginError.textContent = "Error: " + error.message;
            loginError.classList.remove('hidden');
        } else {
            showDashboard(data.user);
        }
    });

    // Evento Logout
    btnLogout.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        showLogin();
    });

    function showLogin() {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        if(countdownInterval) clearInterval(countdownInterval);
        if(realtimeSubscription) supabaseClient.removeChannel(realtimeSubscription);
    }

    function showDashboard(user) {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        adminUserEmail.textContent = user.email;
        loadCurrentSorteo();
    }

    // Cargar el sorteo más reciente
    async function loadCurrentSorteo() {
        const { data, error } = await supabaseClient
            .from('sorteos')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            alert('Error al cargar el sorteo: ' + error.message);
            return;
        }

        if (data && data.length > 0) {
            currentSorteo = data[0];
            fillSorteoForm(currentSorteo);
            loadParticipantes(currentSorteo.id);
            subscribeToParticipantes(currentSorteo.id);
        } else {
            badgeStatus.textContent = "Estado: No hay sorteos configurados";
            badgeStatus.style.borderColor = "var(--text-secondary)";
        }
    }

    function fillSorteoForm(sorteo) {
        document.getElementById('sorteo-titulo').value = sorteo.titulo;
        document.getElementById('sorteo-premio').value = sorteo.premio;
        
        // Formatear fecha para el input datetime-local
        const dateObj = new Date(sorteo.fecha_sorteo);
        // Ajustar offset local
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        const localISOTime = (new Date(dateObj - tzoffset)).toISOString().slice(0, 16);
        document.getElementById('sorteo-fecha').value = localISOTime;

        badgeStatus.textContent = `Estado: ${sorteo.estado.toUpperCase()}`;
        if(sorteo.estado === 'activo') badgeStatus.style.borderColor = "#00ff00";
        else if(sorteo.estado === 'pausado') badgeStatus.style.borderColor = "#ff9d00";
        else badgeStatus.style.borderColor = "var(--text-secondary)";

        btnPausar.classList.remove('hidden');
        btnFinalizar.classList.remove('hidden');

        if(sorteo.estado === 'activo') {
            btnPausar.textContent = "Pausar Sorteo";
        } else if(sorteo.estado === 'pausado') {
            btnPausar.textContent = "Reanudar Sorteo";
        } else {
            btnPausar.classList.add('hidden');
            btnFinalizar.classList.add('hidden');
        }

        startAdminCountdown(dateObj);
    }

    // Guardar / Crear Sorteo
    sorteoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titulo = document.getElementById('sorteo-titulo').value;
        const premio = document.getElementById('sorteo-premio').value;
        const fecha = new Date(document.getElementById('sorteo-fecha').value).toISOString();

        if (confirm('¿Estás seguro de guardar los cambios e iniciar el sorteo?')) {
            let res;
            if (currentSorteo) {
                // Actualizar
                res = await supabaseClient.from('sorteos').update({
                    titulo, premio, fecha_sorteo: fecha, estado: 'activo'
                }).eq('id', currentSorteo.id).select();
            } else {
                // Insertar
                res = await supabaseClient.from('sorteos').insert({
                    titulo, premio, fecha_sorteo: fecha, estado: 'activo'
                }).select();
            }

            if (res.error) {
                alert('Error al guardar: ' + res.error.message);
            } else {
                alert('Sorteo guardado correctamente.');
                loadCurrentSorteo();
            }
        }
    });

    // Pausar/Reanudar
    btnPausar.addEventListener('click', async () => {
        if (!currentSorteo) return;
        const newStatus = currentSorteo.estado === 'activo' ? 'pausado' : 'activo';
        if (confirm(`¿Deseas ${newStatus === 'pausado' ? 'pausar' : 'reanudar'} el sorteo?`)) {
            const { error } = await supabaseClient.from('sorteos').update({ estado: newStatus }).eq('id', currentSorteo.id);
            if (error) alert('Error: ' + error.message);
            else loadCurrentSorteo();
        }
    });

    // Finalizar
    btnFinalizar.addEventListener('click', async () => {
        if (!currentSorteo) return;
        if (confirm('¿Estás seguro de finalizar el sorteo manualmente? Esto detendrá el contador.')) {
            const { error } = await supabaseClient.from('sorteos').update({ estado: 'finalizado' }).eq('id', currentSorteo.id);
            if (error) alert('Error: ' + error.message);
            else loadCurrentSorteo();
        }
    });

    // Cargar Participantes
    async function loadParticipantes(sorteoId) {
        const { data, error } = await supabaseClient
            .from('participantes')
            .select('*')
            .eq('sorteo_id', sorteoId)
            .order('fecha_registro', { ascending: false });

        if (error) {
            console.error(error);
            return;
        }

        renderParticipantes(data);
    }

    let participantesData = [];
    function renderParticipantes(data) {
        participantesData = data;
        countSpan.textContent = data.length;
        tbody.innerHTML = '';
        data.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.nombre}</td>
                <td>${p.email}</td>
                <td>${new Date(p.fecha_registro).toLocaleString()}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Suscripción a Realtime para participantes
    function subscribeToParticipantes(sorteoId) {
        if(realtimeSubscription) {
            supabaseClient.removeChannel(realtimeSubscription);
        }
        
        realtimeSubscription = supabaseClient.channel('custom-insert-channel')
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'participantes', filter: `sorteo_id=eq.${sorteoId}` },
            (payload) => {
                participantesData.unshift(payload.new);
                renderParticipantes(participantesData);
            }
        )
        .subscribe();
    }

    // Elegir Ganador Aleatorio
    btnElegirGanador.addEventListener('click', () => {
        if(participantesData.length === 0) {
            alert('No hay participantes registrados.');
            return;
        }

        if(confirm('¿Deseas seleccionar un ganador al azar ahora?')) {
            winnerResult.classList.remove('hidden');
            winnerResult.innerHTML = 'Seleccionando...';
            
            // Efecto de selección
            let counter = 0;
            const maxCycles = 20;
            const interval = setInterval(() => {
                const randomObj = participantesData[Math.floor(Math.random() * participantesData.length)];
                winnerResult.innerHTML = `🎲 ${randomObj.nombre} (${randomObj.email})`;
                counter++;
                if(counter >= maxCycles) {
                    clearInterval(interval);
                    const ganadorFinal = participantesData[Math.floor(Math.random() * participantesData.length)];
                    winnerResult.innerHTML = `🏆 ¡GANADOR/A: <strong>${ganadorFinal.nombre}</strong>!<br><span style="font-size:1rem; color:#fff">${ganadorFinal.email}</span>`;
                }
            }, 100);
        }
    });

    // Exportar CSV
    btnExportCSV.addEventListener('click', () => {
        if(participantesData.length === 0) {
            alert('No hay datos para exportar');
            return;
        }
        
        const headers = ['Nombre', 'Email', 'Fecha Registro'];
        const csvRows = [];
        csvRows.push(headers.join(','));

        participantesData.forEach(p => {
            const row = [
                `"${p.nombre}"`,
                `"${p.email}"`,
                `"${new Date(p.fecha_registro).toLocaleString()}"`
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'participantes_creo.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    // Contador Admin
    function startAdminCountdown(dateObj) {
        if(countdownInterval) clearInterval(countdownInterval);
        
        countdownInterval = setInterval(() => {
            if(currentSorteo && currentSorteo.estado === 'finalizado') {
                adminCountdown.textContent = 'Sorteo Finalizado';
                clearInterval(countdownInterval);
                return;
            }

            const now = new Date().getTime();
            const gap = dateObj.getTime() - now;

            if (gap <= 0) {
                adminCountdown.textContent = 'Tiempo Agotado (Finalizando...)';
                // Trigger reload
                loadCurrentSorteo();
                clearInterval(countdownInterval);
                return;
            }

            const second = 1000;
            const minute = second * 60;
            const hour = minute * 60;
            const day = hour * 24;

            const d = Math.floor(gap / day);
            const h = Math.floor((gap % day) / hour);
            const m = Math.floor((gap % hour) / minute);
            const s = Math.floor((gap % minute) / second);

            adminCountdown.textContent = `Tiempo restante: ${d}d ${h}h ${m}m ${s}s`;
        }, 1000);
    }
});
