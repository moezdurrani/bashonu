import styled from "styled-components";
import React from "react";
import { Link } from "react-router-dom";
import "./About.css";

function About() {
  return (
    <div className="about-page">
      <h1>
        Welcome to Our Preservation Hub for{" "} <strong>Chitrali & Gilgit-Baltistani Music</strong>
      </h1>
      <p>
        Our website is dedicated to protecting and celebrating the rich musical
        heritage of the people of <strong>Chitral and Gilgit-Baltistan</strong> by
        preserving the cherished traditional songs of the region’s languages.
        As the echoes of these timeless melodies risk fading into obscurity, we
        have created a dynamic platform where enthusiasts can upload and access
        lyrics, ensuring that our cultural treasures remain alive and accessible
        for generations to come.
      </p>
      <h2>Why We Need Your Help:</h2>
      <p>
        These songs are more than just music; they are living history, capturing
        the emotions, stories, and traditions of the mountains of Chitral and
        Gilgit-Baltistan. By contributing lyrics, sharing knowledge, or simply
        exploring our collection, you help keep this shared heritage vibrant and
        meaningful.
      </p>
      <h2>Join Us in Protecting Our Musical Heritage</h2>
      <p>
        We invite all lovers of Chitrali and Gilgit-Baltistani music to
        contribute to our growing repository and to engage with a community that
        values cultural preservation. Together, we can ensure that the voices
        of our northern regions continue to be heard, remembered, and
        celebrated.
      </p>
      <p>
        Stay connected and involved—follow us on social media and YouTube for
        regular updates, feature releases, and community events.
      </p>
      <p>
        {/* <Link to="/contact" className="about-contact-link">
          Contact Me
        </Link> */}
        <Link
          to="https://forms.zohopublic.com/khowarbashonugm1/form/ContactUsForm/formperma/h1q9srGUXgy_e0xXeNYeiwZLBp-ZC0AhZNetIkjhI_Q"
          className="about-contact-link"
        >
          Contact Me
        </Link>
      </p>
    </div>
  );
}

export default About;
