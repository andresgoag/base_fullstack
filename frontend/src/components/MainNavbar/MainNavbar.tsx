import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import { useAuthContext } from "context/auth/AuthContext";
import { LanguageSwitcher } from "components/LanguageSwitcher/LanguageSwitcher";
import { ROUTES } from "routes";

export const MainNavbar = () => {
  const { t } = useTranslation();
  const { logout, currentUser } = useAuthContext();
  const displayName = currentUser.isLoading
    ? t("nav.loadingName")
    : (currentUser.user?.first_name ?? t("nav.account"));

  return (
    <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
      <Container>
        <Navbar.Brand as={Link} to={ROUTES.dashboard}>
          {t("nav.brand")}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to={ROUTES.dashboard}>
              {t("nav.dashboard")}
            </Nav.Link>
            <Nav.Link as={Link} to={ROUTES.websocket}>
              {t("nav.websocket")}
            </Nav.Link>
            <Nav.Link as={Link} to={ROUTES.comments}>
              {t("nav.comments")}
            </Nav.Link>
          </Nav>
          <Nav className="align-items-lg-center gap-lg-2">
            <LanguageSwitcher />
            <NavDropdown
              title={displayName}
              id="account-nav-dropdown"
              align="end"
            >
              <NavDropdown.Item as={Link} to={ROUTES.account}>
                {t("nav.account")}
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={logout}>
                {t("nav.logout")}
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};
