import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import bashonuImage from "../assets/bashonu1.png";
import "./Header.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser } from "@fortawesome/free-solid-svg-icons";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <header className="header">
      <div className="nav_logo">
        <Link to="/" className="nav-logo-link" onClick={() => setIsOpen(false)}>
          <img src={bashonuImage} alt="Bashonu" />
        </Link>
      </div>
      <label
        htmlFor="menu-toggle"
        className="menuToggleBtn"
        onClick={toggleMenu}
      >
        {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </label>
      <ul
        className={`nav-menu ${isOpen ? "open" : ""}`}
        style={{ right: isOpen ? "0" : "-100%" }}
      >
        <li>
          <Link
            to="/"
            className="nav-menu-list"
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>
        </li>
        <li>
          <Link
            to="/Trending"
            className="nav-menu-list"
            onClick={() => setIsOpen(false)}
          >
            Trending
          </Link>
        </li>
        <li>
          <Link
            to="/about"
            className="nav-menu-list"
            onClick={() => setIsOpen(false)}
          >
            About
          </Link>
        </li>
        <li>
          <Link
            to="/Profile"
            className="nav-menu-list profile-link"
            onClick={() => setIsOpen(false)}
          >
            <FontAwesomeIcon icon={faCircleUser} />
          </Link>
        </li>
      </ul>
    </header>
  );
};

export default Header;
