import React from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import DashboardIcon from '@mui/icons-material/SpaceDashboard';
import MovieIcon from '@mui/icons-material/MovieCreation';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import PeopleIcon from '@mui/icons-material/People';
import HealthIcon from '@mui/icons-material/HealthAndSafety';
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/content', label: 'Content', icon: <MovieIcon /> },
  { to: '/series', label: 'Series', icon: <LiveTvIcon /> },
  { to: '/users', label: 'Users', icon: <PeopleIcon /> },
  { to: '/health', label: 'Integrations', icon: <HealthIcon /> }
];

const Sidebar: React.FC = () => {
  return (
    <Box sx={{ width: 240, flexShrink: 0, borderRight: '1px solid #e5e7eb' }}>
      <Toolbar />
      <List>
        {items.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            sx={{ '&.active': { bgcolor: '#e8f0ff', color: 'primary.main' } }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
};

export default Sidebar;
