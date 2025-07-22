import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar
} from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Event } from '@mui/icons-material';
import { useAuth } from '../context/Authcontext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  // Extract eventId from URL if present
  const eventIdMatch = location.pathname.match(/^\/events\/([^/]+)/);
  const eventId = eventIdMatch ? eventIdMatch[1] : null;

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        {/* <Event sx={{ mr: 2 }} /> */}
       <img 
  src="https://img.freepik.com/premium-vector/alphabetical-letter-e-logo-collection_647881-448.jpg" 
  style={{ 
    height: '40px', 
    width: '40px', 
    borderRadius: '20px' 
  }} 
  alt="Logo"
/>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1 }}
        >
          <Link
            to="/dashboard"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            Event Ease
          </Link>
        </Typography>

        {user ? (
          <>
            <Button color="inherit" component={Link} to="/dashboard">
              Dashboard
            </Button>
            <Button color="inherit" component={Link} to="/events">
              Events
            </Button>

            {/* Show Tasks link only if eventId exists in URL */}
            {eventId && (
              <Button color="inherit" component={Link} to={`/events/${eventId}/tasks`}>
                Tasks
              </Button>
            )}

            <IconButton
              size="large"
              onClick={handleMenu}
              color="inherit"
              aria-controls="user-menu"
              aria-haspopup="true"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user.username?.[0]?.toUpperCase()}
              </Avatar>
            </IconButton>

            <Menu
              id="user-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
            >
              <MenuItem onClick={handleProfile}>Profile</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </>
        ) : (
          <Box>
            <Button color="inherit" component={Link} to="/login">
              Login
            </Button>
            <Button color="inherit" component={Link} to="/register">
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
