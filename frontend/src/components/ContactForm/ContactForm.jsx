import { useEffect, useState } from "react";
import axiosInstance from "../../axios";
import { useNavigate, useLocation } from "react-router-dom";
import "./ContactForm.css";
const ContactForm = () => {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const route = location.pathname.split("/")[1];
  let contact_id = null;
  if (route === "update-contact") {
    contact_id = location.pathname.split("/")[2];
  }

  // console.log(route, contact_id);
  const getContact = () => {
    axiosInstance()
      .get("/get-contact/" + contact_id)
      .then((res) => {
        setName(res.data.contact.name);
        setNumber(res.data.contact.number);
      });
  };

  useEffect(() => {
    if (route === "update-contact") {
      getContact();
    }
  }, []);

  const addContact = (e) => {
    e.preventDefault();
    // make api call to add contact

    const requestBody = {
      name,
      number,
    };

    if (route === "update-contact") {
      axiosInstance()
        .patch("/update-contact/" + contact_id, requestBody)
        .then(() => {
          setName("");
          setNumber("");
          navigate("/");
        });
    } else {
      axiosInstance()
        .post("/add-contact", requestBody)
        .then(() => {
          setName("");
          setNumber("");
          navigate("/");
        });
    }
  };

  return (
    <form onSubmit={addContact} className="contact-form">
      <div className="arrange">
        <label htmlFor="">Name:</label>
        <input
          type="text"
          name="name"
          id="name"
          onChange={(e) => {
            setName(e.target.value);
          }}
          value={name}
        />
      </div>
      <div className="arrange">
        <label htmlFor="number">Number:</label>
        <input
          type="text"
          name="number"
          id="number"
          onChange={(e) => {
            setNumber(e.target.value);
          }}
          value={number}
        />
      </div>

      <button type="submit">
        {route === "update-contact" ? "Update" : "Add"}
      </button>
    </form>
  );
};

export default ContactForm;




