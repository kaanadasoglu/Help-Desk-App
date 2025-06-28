import React, { useState, useEffect } from "react";
import "./App.css";
import helpIcon from "./assets/helpdesk-icon.png";
import companyIcon from "./assets/texchmax.png";
import logOut from "./assets/logout.png";
import user from "./assets/user.png";
import Login from "./Login";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null);
  const [activePage, setActivePage] = useState("all-tickets");
  const [tickets, setTickets] = useState([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAssigned, setFilterAssigned] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newSubject, setNewSubject] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState("Orta");
  const [responseMessage, setResponseMessage] = useState("");

  const currentUser = localStorage.getItem("fullName") || "";
  const currentUserEmail = localStorage.getItem("email") || "";
  const currentUserRole = localStorage.getItem("role") || "";

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    if (token) {
      setIsAuthenticated(true);
      setRole(storedRole);
      if (storedRole === "admin") setActivePage("assigned-tickets");
      else setActivePage("new-ticket");
      fetchTickets();
    }
  }, []);

  const fetchTickets = () => {
    fetch("http://localhost:5000/tickets")
      .then((res) => res.json())
      .then((data) => {
        setTickets(data);
      })
      .catch((err) => {
        alert("Talepler alınırken hata oluştu: " + err.message);
      });
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setRole(null);
    setTickets([]);
  };

  const handleLoginSuccess = (userData) => {
    localStorage.setItem("token", userData.token);
    localStorage.setItem("fullName", userData.fullName);
    localStorage.setItem("email", userData.email);
    localStorage.setItem("role", userData.role);
    setIsAuthenticated(true);
    setRole(userData.role);
    setActivePage(userData.role === "admin" ? "assigned-tickets" : "new-ticket");
    fetchTickets();
  };

  const handleMenuClick = (page) => {
    setActivePage(page);
    setFilterStatus("");
    setFilterAssigned("");
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setSelectedTicket(null);
  };

  // Yeni talep oluşturma
  const handleNewTicketSubmit = (e) => {
    e.preventDefault();
    if (!newSubject.trim()) {
      alert("Konu başlığı boş olamaz.");
      return;
    }

    fetch("http://localhost:5000/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newSubject,
        priority: newPriority,
        description: newDescription,
        createdBy: currentUserEmail,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || errorData.message || "Backend hatası");
        }
        return res.json();
      })
      .then((data) => {
        setTickets([data, ...tickets]);
        setNewSubject("");
        setNewDescription("");
        setNewPriority("Orta");
        setActivePage("all-tickets");
      })
      .catch((err) => {
        alert("Talep oluşturulurken hata oluştu: " + err.message);
      });
  };

  // Cevap ekleme fonksiyonu
  const handleAddResponse = () => {
    if (!responseMessage.trim()) {
      alert("Cevap boş olamaz.");
      return;
    }

    fetch(`http://localhost:5000/tickets/${selectedTicket._id}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        responderEmail: currentUserEmail,
        message: responseMessage,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || errorData.message || "Backend hatası");
        }
        return res.json();
      })
      .then(({ ticket }) => {
        const updatedTickets = tickets.map((t) =>
          t._id === ticket._id ? ticket : t
        );
        setTickets(updatedTickets);
        setSelectedTicket(ticket);
        setResponseMessage("");
      })
      .catch((err) => {
        alert("Cevap gönderilirken hata oluştu: " + err.message);
      });
  };


  const handleMarkAsResolved = () => {
    fetch(`http://localhost:5000/tickets/${selectedTicket._id}/resolve`, {
      method: "POST",
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || errorData.message || "Backend hatası");
        }
        return res.json();
      })
      .then(({ ticket }) => {
        const updatedTickets = tickets.map((t) =>
          t._id === ticket._id ? ticket : t
        );
        setTickets(updatedTickets);
        setSelectedTicket(ticket);
      })
      .catch((err) => {
        alert("Talep kapatılırken hata oluştu: " + err.message);
      });
  };

  // Filtrelenmiş liste
  const filteredTickets = tickets.filter((t) => {
    const dueDate = new Date(t.dueDate);
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    const matchesDate =
      (!fromDate || dueDate >= fromDate) && (!toDate || dueDate <= toDate);

    return (
      (filterStatus ? t.status === filterStatus : true) &&
      (filterAssigned ? t.assignedTo === filterAssigned : true) &&
      (search
        ? t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.createdBy.toLowerCase().includes(search.toLowerCase()) ||
          t.assignedTo.toLowerCase().includes(search.toLowerCase())
        : true) &&
      matchesDate
    );
  });

 
  const assignedTickets = tickets.filter(
    (t) => t.assignedTo === currentUser && (filterStatus ? t.status === filterStatus : true)
  );

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <nav className="sidebar">
        <div className="menu">
          <div className="title">
            <h1>Help Desk</h1>
            <img src={helpIcon} alt="Help Icon" className="help-icon" />
          </div>
          <ul>
            {role === "admin" ? (
              <>
                <li
                  className={activePage === "assigned-tickets" ? "active" : ""}
                  onClick={() => handleMenuClick("assigned-tickets")}
                >
                  Atanan Talepler
                </li>
                <li
                  className={activePage === "all-tickets" ? "active" : ""}
                  onClick={() => handleMenuClick("all-tickets")}
                >
                  Tüm Talepler
                </li>
              </>
            ) : (
              <>
                <li
                  className={activePage === "new-ticket" ? "active" : ""}
                  onClick={() => handleMenuClick("new-ticket")}
                >
                  Yeni Talep Oluştur
                </li>
                <li
                  className={activePage === "old-tickets" ? "active" : ""}
                  onClick={() => handleMenuClick("old-tickets")}
                >
                  Eski Taleplerim
                </li>
                <li
                  className={activePage === "all-tickets" ? "active" : ""}
                  onClick={() => handleMenuClick("all-tickets")}
                >
                  Tüm Talepler
                </li>
              </>
            )}
          </ul>
        </div>

        <div className="profile">
          <div className="user">
            <img src={user} alt="user icon" className="user-icon" />
            <span>{currentUser || "Kullanıcı"}</span>
          </div>
          <div className="log-out" onClick={handleLogout}>
            <img src={logOut} alt="logout Icon" className="logout-icon" />
            <span>Oturumu Kapat</span>
          </div>
        </div>
      </nav>

      <div className="main-content">
        <header className="header">
          <img src={companyIcon} alt="Company Icon" className="company-icon" />
        </header>

        <section className="page-content" style={{ padding: "20px" }}>
         
          {role === "admin" && activePage === "assigned-tickets" && (
            <>
              <h2>Atanan Talepler</h2>
              {assignedTickets.length === 0 ? (
                <p>Kayıt bulunamadı.</p>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Konu</th>
                        <th>Yazan</th>
                        <th>İlgilenen</th>
                        <th>Durum</th>
                        <th>Son Güncelleme</th>
                        <th>Öncelik</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedTickets.map((ticket) => (
                        <tr
                          key={ticket._id}
                          onClick={() => setSelectedTicket(ticket)}
                          style={{ cursor: "pointer" }}
                        >
                          <td>{ticket.title}</td>
                          <td>{ticket.createdBy}</td>
                          <td>{ticket.assignedTo}</td>
                          <td>{ticket.status}</td>
                          <td>{new Date(ticket.dueDate).toLocaleString()}</td>
                          <td className="priority-cell">
                            <span
                              className={`priority-dot ${ticket.priority.toLowerCase()}`}
                            ></span>
                            {ticket.priority}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

       
          {activePage === "all-tickets" && (
            <>
              <section className="filters">
                <input
                  type="text"
                  placeholder="Ara: konu, isim..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">Durum Filtrele</option>
                  <option value="Açık">Açık</option>
                  <option value="Kapalı">Kapalı</option>
                  <option value="Beklemede">Beklemede</option>
                </select>
                <select
                  value={filterAssigned}
                  onChange={(e) => setFilterAssigned(e.target.value)}
                >
                  <option value="">İlgilenen Kişi</option>
                  {Array.from(new Set(tickets.map((t) => t.assignedTo))).map(
                    (name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    )
                  )}
                </select>
                <label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </label>
                <label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </label>
              </section>

              <main>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Konu</th>
                        <th>Yazan</th>
                        <th>İlgilenen</th>
                        <th>Durum</th>
                        <th>Son Güncelleme</th>
                        <th>Öncelik</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.length === 0 && (
                        <tr>
                          <td colSpan="6" className="no-data">
                            Kayıt bulunamadı.
                          </td>
                        </tr>
                      )}
                      {filteredTickets.map((ticket) => (
                        <tr
                          key={ticket._id}
                          onClick={() => setSelectedTicket(ticket)}
                          style={{ cursor: "pointer" }}
                        >
                          <td>{ticket.title}</td>
                          <td>{ticket.createdBy}</td>
                          <td>{ticket.assignedTo}</td>
                          <td>{ticket.status}</td>
                          <td>{new Date(ticket.dueDate).toLocaleString()}</td>
                          <td className="priority-cell">
                            <span
                              className={`priority-dot ${ticket.priority.toLowerCase()}`}
                            ></span>
                            {ticket.priority}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedTicket && (
                  <div className="detail-modal">
                    <div className="detail-content">
                      <button
                        className="close-btn"
                        onClick={() => setSelectedTicket(null)}
                      >
                        X
                      </button>
                      <h2>{selectedTicket.title}</h2>
                      <p>
                        <strong>Açıklama:</strong> {selectedTicket.description}
                      </p>
                      <p>
                        <strong>Son Güncelleme:</strong>{" "}
                        {new Date(selectedTicket.dueDate).toLocaleString()}
                      </p>
                      <p>
                        <strong>Öncelik:</strong> {selectedTicket.priority}
                      </p>
                      <p>
                        <strong>Durum:</strong> {selectedTicket.status}
                      </p>
                      <p>
                        <strong>İlgilenen:</strong> {selectedTicket.assignedTo}
                      </p>

                      <div className="responses-section">
                        <h3>Cevaplar</h3>
                        {selectedTicket.responses &&
                        selectedTicket.responses.length > 0 ? (
                          <ul>
                            {selectedTicket.responses.map((resp, i) => (
                              <li key={i}>
                                <strong
                                  style={{
                                    color: resp.role === "admin" ? "red" : "black",
                                  }}
                                >
                                  {resp.responder}
                                </strong>{" "}
                                ({new Date(resp.date).toLocaleString()}):
                                <br />
                                {resp.message}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>Henüz cevap yok.</p>
                        )}
                      </div>

                    
                      <div className="response-form">
                        <textarea
                          rows="3"
                          placeholder="Cevabınızı yazın..."
                          value={responseMessage}
                          onChange={(e) => setResponseMessage(e.target.value)}
                        />
                        <button
                          onClick={handleAddResponse}
                          className="btn-submit"
                          style={{ marginRight: "10px" }}
                        >
                          Cevap Gönder
                        </button>
                
                        {selectedTicket.status !== "Kapalı" && (
                          <button
                            onClick={handleMarkAsResolved}
                            className="btn-resolve"
                          >
                            Çözüldü Olarak İşaretle
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </main>
            </>
          )}

       
          {role === "user" && activePage === "new-ticket" && (
            <form className="new-ticket-form" onSubmit={handleNewTicketSubmit}>
              <h2>Yeni Talep Oluştur</h2>
              <label>
                Konu Başlığı:
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  required
                />
              </label>

              <label>
                Öncelik:
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                >
                  <option value="Düşük">Düşük</option>
                  <option value="Orta">Orta</option>
                  <option value="Yüksek">Yüksek</option>
                </select>
              </label>

              <label>
                Açıklama:
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={4}
                  required
                />
              </label>

              <button type="submit">Gönder</button>
            </form>
          )}

     
          {role === "user" && activePage === "old-tickets" && (
            <>
              <h2>Eski Taleplerim</h2>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Konu</th>
                      <th>İlgilenen</th>
                      <th>Durum</th>
                      <th>Son Güncelleme</th>
                      <th>Öncelik</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.filter((t) => t.createdBy === currentUser).length ===
                      0 && (
                      <tr>
                        <td colSpan="5" className="no-data">
                          Kayıt bulunamadı.
                        </td>
                      </tr>
                    )}
                    {tickets
                      .filter((t) => t.createdBy === currentUser)
                      .map((ticket) => (
                        <tr
                          key={ticket._id}
                          onClick={() => setSelectedTicket(ticket)}
                          style={{ cursor: "pointer" }}
                        >
                          <td>{ticket.title}</td>
                          <td>{ticket.assignedTo}</td>
                          <td>{ticket.status}</td>
                          <td>{new Date(ticket.dueDate).toLocaleString()}</td>
                          <td className="priority-cell">
                            <span
                              className={`priority-dot ${ticket.priority.toLowerCase()}`}
                            ></span>
                            {ticket.priority}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {selectedTicket && (
                <article className="ticket-details">
                  <h3>{selectedTicket.title}</h3>
                  <p>
                    <b>Açan:</b> {selectedTicket.createdBy}
                  </p>
                  <p>
                    <b>İlgilenen:</b> {selectedTicket.assignedTo}
                  </p>
                  <p>
                    <b>Durum:</b> {selectedTicket.status}
                  </p>
                  <p>
                    <b>Öncelik:</b> {selectedTicket.priority}
                  </p>
                  <p>
                    <b>Açıklama:</b> {selectedTicket.description}
                  </p>
                  <p>
                    <b>Son Güncelleme:</b>{" "}
                    {new Date(selectedTicket.dueDate).toLocaleString()}
                  </p>

                  <section>
                    <h4>Cevaplar</h4>
                    {selectedTicket.responses.length === 0 && <p>Henüz cevap yok.</p>}
                    <ul>
                      {selectedTicket.responses.map((resp, i) => (
                        <li key={i}>
                          <b>{resp.responder}</b> ({new Date(resp.date).toLocaleString()}
                          ): <br />
                          {resp.message}
                        </li>
                      ))}
                    </ul>
                  </section>
                </article>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
