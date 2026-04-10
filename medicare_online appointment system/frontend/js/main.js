const apiBase = '/api';

const showAlert = (message, type = 'success') => {
  const alertBox = document.getElementById('alertBox');
  if (!alertBox) return;
  alertBox.className = `alert alert-${type}`;
  alertBox.textContent = message;
  alertBox.classList.remove('d-none');
  setTimeout(() => alertBox.classList.add('d-none'), 5000);
};

const saveToken = (token, role, user) => {
  localStorage.setItem('medicareToken', token);
  localStorage.setItem('medicareRole', role);
  localStorage.setItem('medicareUser', JSON.stringify(user || {}));
};

const getToken = () => localStorage.getItem('medicareToken');
const getRole = () => localStorage.getItem('medicareRole');

const fetchJson = async (url, options = {}) => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  return response.json();
};

const initAuthForms = () => {
  const showLogin = document.getElementById('showLogin');
  const showRegister = document.getElementById('showRegister');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const registerRole = document.getElementById('registerRole');
  const doctorFields = document.getElementById('doctorFields');

  if (!showLogin || !showRegister || !loginForm || !registerForm) return;

  showLogin.addEventListener('click', () => {
    loginForm.classList.remove('d-none');
    registerForm.classList.add('d-none');
  });
  showRegister.addEventListener('click', () => {
    registerForm.classList.remove('d-none');
    loginForm.classList.add('d-none');
  });

  registerRole.addEventListener('change', () => {
    doctorFields.classList.toggle('d-none', registerRole.value !== 'doctor');
  });

  document.getElementById('loginButton').addEventListener('click', async () => {
    try {
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value.trim();
      const role = document.getElementById('loginRole').value;
      if (!email || !password) return showAlert('Please complete login fields', 'warning');
      const loginUrl = role === 'admin' ? `${apiBase}/admin/login` : `${apiBase}/auth/login`;
      const body = role === 'admin' ? { username: email, password } : { email, password, role };
      const data = await fetchJson(loginUrl, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      saveToken(data.token, role, data.user || data.admin);
      showAlert('Login successful', 'success');
      window.location.href = 'dashboard.html';
    } catch (err) {
      showAlert(err.message, 'danger');
    }
  });

  document.getElementById('registerButton').addEventListener('click', async () => {
    try {
      const name = document.getElementById('registerName').value.trim();
      const email = document.getElementById('registerEmail').value.trim();
      const password = document.getElementById('registerPassword').value.trim();
      const role = document.getElementById('registerRole').value;
      const specialization = document.getElementById('registerSpecialization').value.trim();
      const contact = document.getElementById('registerContact').value.trim();
      const availability = document.getElementById('registerAvailability').value.trim();
      if (!name || !email || !password) return showAlert('Please complete registration fields', 'warning');
      const body = { name, email, password, role };
      if (role === 'doctor') {
        body.specialization = specialization;
        body.contact = contact;
        body.availability = availability;
      }
      const data = await fetchJson(`${apiBase}/auth/register`, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      showAlert(data.message, 'success');
      loginForm.classList.remove('d-none');
      registerForm.classList.add('d-none');
    } catch (err) {
      showAlert(err.message, 'danger');
    }
  });
};

const getUser = () => {
  const userJson = localStorage.getItem('medicareUser');
  return userJson ? JSON.parse(userJson) : null;
};

const renderAppointmentRow = (appointment) => {
  return `<tr>
    <td>${appointment.doctor_name || appointment.patient_name}</td>
    <td>${appointment.specialization || ''}</td>
    <td>${appointment.date}</td>
    <td>${appointment.time}</td>
    <td>${appointment.status}</td>
  </tr>`;
};

const initDashboard = async () => {
  const dashboardContent = document.getElementById('dashboardContent');
  const logoutButton = document.getElementById('logoutButton');
  const role = getRole();
  const user = getUser();

  if (!dashboardContent) return;
  if (!getToken()) {
    window.location.href = 'login.html';
    return;
  }

  logoutButton?.addEventListener('click', () => {
    localStorage.removeItem('medicareToken');
    localStorage.removeItem('medicareRole');
    localStorage.removeItem('medicareUser');
    window.location.href = 'login.html';
  });

  try {
    if (role === 'patient') {
      dashboardContent.innerHTML = `
        <h2>Patient Dashboard</h2>
        <p>Welcome back, ${user?.name || 'Patient'}.</p>
        <div class="mb-4">
          <a href="booking.html" class="btn btn-primary">Book Appointment</a>
        </div>
        <div id="patientHistory"></div>
      `;
      const history = await fetchJson(`${apiBase}/appointments/${user.id}`);
      document.getElementById('patientHistory').innerHTML = `
        <h4>Your Appointment History</h4>
        <div class="table-responsive">
          <table class="table table-bordered align-middle">
            <thead><tr><th>Doctor</th><th>Specialization</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
            <tbody>${history.map(renderAppointmentRow).join('')}</tbody>
          </table>
        </div>
      `;
    } else if (role === 'doctor') {
      dashboardContent.innerHTML = `
        <h2>Doctor Dashboard</h2>
        <p>Manage your appointments and availability.</p>
        <div class="mb-4" id="availabilitySection"></div>
        <div id="assignedList"></div>
      `;
      const appointments = await fetchJson(`${apiBase}/doctors/appointments`);
      document.getElementById('assignedList').innerHTML = `
        <h4>Assigned Appointments</h4>
        <div class="table-responsive">
          <table class="table table-bordered align-middle">
            <thead><tr><th>Patient</th><th>Email</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
            <tbody>${appointments.map((appt) => `
              <tr>
                <td>${appt.patient_name}</td>
                <td>${appt.patient_email}</td>
                <td>${appt.date}</td>
                <td>${appt.time}</td>
                <td>${appt.status}</td>
              </tr>`).join('')}</tbody>
          </table>
        </div>
      `;
    } else if (role === 'admin') {
      dashboardContent.innerHTML = `
        <h2>Admin Dashboard</h2>
        <p>Review doctors, manage patients, and view system reports.</p>
        <div id="adminOverview"></div>
        <div id="adminLists"></div>
      `;
      const report = await fetchJson(`${apiBase}/admin/dashboard`);
      document.getElementById('adminOverview').innerHTML = `
        <div class="row g-3 mb-4">
          <div class="col-md-4"><div class="card p-3 bg-light"><h5>Total Doctors</h5><p>${report.totalDoctors}</p></div></div>
          <div class="col-md-4"><div class="card p-3 bg-light"><h5>Total Patients</h5><p>${report.totalPatients}</p></div></div>
          <div class="col-md-4"><div class="card p-3 bg-light"><h5>Total Appointments</h5><p>${report.totalAppointments}</p></div></div>
        </div>
      `;
      const doctorRows = report.doctors.map((doc) => `
        <tr><td>${doc.name}</td><td>${doc.specialization}</td><td>${doc.contact}</td><td>${doc.approved ? 'Approved' : 'Pending'}</td></tr>`).join('');
      const patientRows = report.patients.map((pat) => `
        <tr><td>${pat.name}</td><td>${pat.email}</td></tr>`).join('');
      document.getElementById('adminLists').innerHTML = `
        <h4>Doctor List</h4>
        <div class="table-responsive">
          <table class="table table-bordered align-middle"><thead><tr><th>Name</th><th>Specialization</th><th>Contact</th><th>Status</th></tr></thead><tbody>${doctorRows}</tbody></table>
        </div>
        <h4 class="mt-4">Patient List</h4>
        <div class="table-responsive">
          <table class="table table-bordered align-middle"><thead><tr><th>Name</th><th>Email</th></tr></thead><tbody>${patientRows}</tbody></table>
        </div>
      `;
    } else {
      dashboardContent.innerHTML = `<h2>Dashboard</h2><p>Role not recognized.</p>`;
    }
  } catch (err) {
    showAlert(err.message, 'danger');
  }
};

const initBookingPage = async () => {
  const logoutButton = document.getElementById('logoutButton');
  const user = getUser();
  if (!getToken() || !user) {
    window.location.href = 'login.html';
    return;
  }
  logoutButton?.addEventListener('click', () => {
    localStorage.removeItem('medicareToken');
    localStorage.removeItem('medicareRole');
    localStorage.removeItem('medicareUser');
    window.location.href = 'login.html';
  });

  const doctorSelect = document.getElementById('doctorSelect');
  const appointmentForm = document.getElementById('appointmentForm');
  const historySection = document.getElementById('historySection');

  try {
    const doctors = await fetchJson(`${apiBase}/doctors`);
    doctorSelect.innerHTML = doctors.map((doc) => `<option value="${doc.id}">${doc.name} - ${doc.specialization}</option>`).join('');
    const history = await fetchJson(`${apiBase}/appointments/${user.id}`);
    historySection.innerHTML = `
      <h4>Appointment History</h4>
      <div class="table-responsive">
        <table class="table table-bordered align-middle"><thead><tr><th>Doctor</th><th>Specialization</th><th>Date</th><th>Time</th><th>Status</th></tr></thead><tbody>${history.map(renderAppointmentRow).join('')}</tbody></table>
      </div>
    `;
  } catch (err) {
    showAlert(err.message, 'danger');
  }

  appointmentForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const doctor_id = doctorSelect.value;
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;
    if (!doctor_id || !date || !time) return showAlert('Please choose doctor, date and time', 'warning');
    try {
      await fetchJson(`${apiBase}/appointments`, {
        method: 'POST',
        body: JSON.stringify({ doctor_id, date, time })
      });
      showAlert('Appointment booked successfully', 'success');
      appointmentForm.reset();
      const history = await fetchJson(`${apiBase}/appointments/${user.id}`);
      historySection.innerHTML = `
        <h4>Appointment History</h4>
        <div class="table-responsive">
          <table class="table table-bordered align-middle"><thead><tr><th>Doctor</th><th>Specialization</th><th>Date</th><th>Time</th><th>Status</th></tr></thead><tbody>${history.map(renderAppointmentRow).join('')}</tbody></table>
        </div>
      `;
    } catch (err) {
      showAlert(err.message, 'danger');
    }
  });
};

if (window.location.pathname.endsWith('login.html')) {
  initAuthForms();
}
if (window.location.pathname.endsWith('dashboard.html')) {
  initDashboard();
}
if (window.location.pathname.endsWith('booking.html')) {
  initBookingPage();
}
