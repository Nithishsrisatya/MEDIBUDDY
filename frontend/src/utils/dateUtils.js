// Date formatting utilities for appointments and general use

export const dateUtils = {
    /**
     * Format date for display in appointment cards/lists
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date string
     */
    formatAppointmentDate: (date) => {
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    /**
     * Format time for display in appointment cards/lists
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted time string
     */
    formatAppointmentTime: (date) => {
        const dateObj = new Date(date);
        return dateObj.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Format date and time together for appointment display
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date and time string
     */
    formatAppointmentDateTime: (date) => {
        const dateObj = new Date(date);
        return dateObj.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Format date for input fields (YYYY-MM-DD)
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date string for input
     */
    formatDateForInput: (date) => {
        const dateObj = new Date(date);
        return dateObj.toISOString().split('T')[0];
    },

    /**
     * Format time for input fields (HH:MM)
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted time string for input
     */
    formatTimeForInput: (date) => {
        const dateObj = new Date(date);
        return dateObj.toTimeString().slice(0, 5);
    },

    /**
     * Check if a date is today
     * @param {string|Date} date - Date to check
     * @returns {boolean} True if date is today
     */
    isToday: (date) => {
        const dateObj = new Date(date);
        const today = new Date();
        return dateObj.toDateString() === today.toDateString();
    },

    /**
     * Check if a date is tomorrow
     * @param {string|Date} date - Date to check
     * @returns {boolean} True if date is tomorrow
     */
    isTomorrow: (date) => {
        const dateObj = new Date(date);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return dateObj.toDateString() === tomorrow.toDateString();
    },

    /**
     * Get relative date string (Today, Tomorrow, or formatted date)
     * @param {string|Date} date - Date to format
     * @returns {string} Relative date string
     */
    getRelativeDate: (date) => {
        if (dateUtils.isToday(date)) {
            return 'Today';
        }
        if (dateUtils.isTomorrow(date)) {
            return 'Tomorrow';
        }
        return dateUtils.formatAppointmentDate(date);
    },

    /**
     * Check if appointment is upcoming (in the future)
     * @param {string|Date} date - Appointment date
     * @returns {boolean} True if appointment is upcoming
     */
    isUpcoming: (date) => {
        const dateObj = new Date(date);
        const now = new Date();
        return dateObj > now;
    },

    /**
     * Check if appointment is in the past
     * @param {string|Date} date - Appointment date
     * @returns {boolean} True if appointment is in the past
     */
    isPast: (date) => {
        const dateObj = new Date(date);
        const now = new Date();
        return dateObj < now;
    },

    /**
     * Get time difference in human readable format
     * @param {string|Date} date - Target date
     * @param {string|Date} fromDate - Base date (defaults to now)
     * @returns {string} Human readable time difference
     */
    getTimeDifference: (date, fromDate = new Date()) => {
        const dateObj = new Date(date);
        const fromDateObj = new Date(fromDate);
        const diffMs = dateObj - fromDateObj;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        if (Math.abs(diffDays) > 0) {
            return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ${diffDays > 0 ? 'from now' : 'ago'}`;
        } else if (Math.abs(diffHours) > 0) {
            return `${Math.abs(diffHours)} hour${Math.abs(diffHours) !== 1 ? 's' : ''} ${diffHours > 0 ? 'from now' : 'ago'}`;
        } else {
            return `${Math.abs(diffMinutes)} minute${Math.abs(diffMinutes) !== 1 ? 's' : ''} ${diffMinutes > 0 ? 'from now' : 'ago'}`;
        }
    },

    /**
     * Add days to a date
     * @param {string|Date} date - Base date
     * @param {number} days - Number of days to add
     * @returns {Date} New date with days added
     */
    addDays: (date, days) => {
        const dateObj = new Date(date);
        dateObj.setDate(dateObj.getDate() + days);
        return dateObj;
    },

    /**
     * Add hours to a date
     * @param {string|Date} date - Base date
     * @param {number} hours - Number of hours to add
     * @returns {Date} New date with hours added
     */
    addHours: (date, hours) => {
        const dateObj = new Date(date);
        dateObj.setHours(dateObj.getHours() + hours);
        return dateObj;
    },

    /**
     * Get start of day
     * @param {string|Date} date - Date to get start of
     * @returns {Date} Start of day
     */
    startOfDay: (date) => {
        const dateObj = new Date(date);
        dateObj.setHours(0, 0, 0, 0);
        return dateObj;
    },

    /**
     * Get end of day
     * @param {string|Date} date - Date to get end of
     * @returns {Date} End of day
     */
    endOfDay: (date) => {
        const dateObj = new Date(date);
        dateObj.setHours(23, 59, 59, 999);
        return dateObj;
    },

    /**
     * Check if two dates are on the same day
     * @param {string|Date} date1 - First date
     * @param {string|Date} date2 - Second date
     * @returns {boolean} True if dates are on the same day
     */
    isSameDay: (date1, date2) => {
        const dateObj1 = new Date(date1);
        const dateObj2 = new Date(date2);
        return dateObj1.toDateString() === dateObj2.toDateString();
    },

    /**
     * Get week day name
     * @param {string|Date} date - Date to get weekday from
     * @returns {string} Weekday name
     */
    getWeekdayName: (date) => {
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    },

    /**
     * Get month name
     * @param {string|Date} date - Date to get month from
     * @returns {string} Month name
     */
    getMonthName: (date) => {
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString('en-US', { month: 'long' });
    }
};

export default dateUtils;
