import React, { useEffect, useState, useCallback } from 'react';
import { Typography, Paper, List, ListItem, ListItemButton, ListItemText, Button, Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';

const DoctorCalendar = ({ doctorId, onSlotSelect }) => {
    const [calendarSlots, setCalendarSlots] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const fetchAvailability = useCallback(async () => {
        if (!doctorId) return;

        try {
            const response = await fetch(`http://localhost:5000/api/appointments/doctor/${doctorId}/availability`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                generateCalendarSlots(data.data.availability, data.data.bookedSlots);
            }
        } catch (error) {
            console.error('Error fetching availability:', error);
        }
    }, [doctorId]);

    useEffect(() => {
        if (doctorId) {
            fetchAvailability();

            // Set up polling for real-time updates every 60 seconds
            const interval = setInterval(fetchAvailability, 60000);

            return () => clearInterval(interval);
        }
    }, [doctorId, fetchAvailability]);

    const generateCalendarSlots = (availability, bookedSlots) => {
        const slots = [];
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        for (let date = new Date(today); date <= nextWeek; date.setDate(date.getDate() + 1)) {
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            const dayAvailability = availability.find(slot => slot.day === dayName);

            if (dayAvailability) {
                const startTime = new Date(`${date.toDateString()} ${dayAvailability.startTime}`);
                const endTime = new Date(`${date.toDateString()} ${dayAvailability.endTime}`);

                for (let time = new Date(startTime); time < endTime; time.setMinutes(time.getMinutes() + 30)) {
                    const slotTime = time.toTimeString().slice(0, 5);
                    const isBooked = bookedSlots.some(booked => {
                        const bookedTime = new Date(booked.dateTime);
                        return bookedTime.toDateString() === date.toDateString() &&
                               bookedTime.getHours() === time.getHours() &&
                               bookedTime.getMinutes() === time.getMinutes();
                    });

                    slots.push({
                        date: date.toISOString().split('T')[0],
                        time: slotTime,
                        status: isBooked ? 'Booked' : 'Free',
                        display: `${date.toLocaleDateString()} ${slotTime}`,
                        fullDate: new Date(date)
                    });
                }
            }
        }
        setCalendarSlots(slots);
    };

    const availableDates = [...new Set(calendarSlots.filter(slot => slot.status === 'Free').map(slot => slot.date))];

    const slotsForSelectedDate = calendarSlots.filter(slot =>
        slot.date === selectedDate.toISOString().split('T')[0] && slot.status === 'Free'
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Select Date & Time
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Button variant="outlined" onClick={fetchAvailability}>
                        Refresh Availability
                    </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box>
                        <DateCalendar
                            value={selectedDate}
                            onChange={setSelectedDate}
                            shouldDisableDate={(date) => !availableDates.includes(date.toISOString().split('T')[0])}
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6">
                            Available Times for {selectedDate.toLocaleDateString()}
                        </Typography>
                        {slotsForSelectedDate.length > 0 ? (
                            <List>
                                {slotsForSelectedDate.map((slot, index) => (
                                    <ListItem key={index} disablePadding>
                                        <ListItemButton onClick={() => onSlotSelect(slot)}>
                                            <ListItemText primary={slot.time} />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography>No available times for this date.</Typography>
                        )}
                    </Box>
                </Box>
            </Paper>
        </LocalizationProvider>
    );
};

export default DoctorCalendar;
