import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const TripwireSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Tripwire flow has been removed — redirect to auth
    navigate('/auth', { replace: true });
  }, [navigate]);

  return null;
};

export default TripwireSuccess;
