import styled from "styled-components";
import React from "react";
import { Link } from "react-router-dom";
import "./About.css";

function About() {
  return (
    <div className="about-page">
      <h1>
        Welcome to Our Preservation Hub for <strong>Chitrali Music</strong>
      </h1>
      <p>
        Our website is dedicated to protecting and celebrating the rich musical
        heritage of the Chitrali people by preserving the cherished songs of the
        Chitrali languages. As the echoes of these traditional melodies risk
        fading into obscurity, we have created a dynamic platform where
        enthusiasts can both upload and access lyrics, ensuring that our
        cultural treasures are preserved and accessible for generations to come.
      </p>
      <h2>Why We Need Your Help:</h2>
      <p>
        These songs are more than just music; they are a living history,
        capturing the essence of our culture and traditions. By contributing
        lyrics, sharing stories, or simply exploring our collection, you help
        keep our heritage vibrant and alive.
      </p>
      <h2>Join Us in Protecting Chitrali Music.</h2>
      <p>
        We invite all lovers of Chitrali music to contribute to our growing
        repository and to engage with a community that cherishes these
        historical treasures. Together, we can ensure that the voice of Chitral
        remains strong and resonant.
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
