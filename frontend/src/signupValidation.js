function validation(values) {

        const errors = {}
        const email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const password_pattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/

        if (!values.name) {
                errors.name = "Name is required";
        }
        else if (values.name.length < 2) {
                errors.name = "Name is too short";
        }
        // No error for name, do not set error.name

        if (!values.email) {
                errors.email = "Email is required";
        } 
        else if (!email_pattern.test(values.email)) {
                errors.email = "Email is not valid";
        } else {
                errors.email = "";
        }

        if (!values.password) {
                errors.password = "Password is required";
        }        
        else if (!password_pattern.test(values.password)) {
                errors.password = "Password is not valid";
        } else {
                errors.password = "";
        }
        return errors;
}
export default validation;
