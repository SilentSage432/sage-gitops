import React from "react";

interface LoaderProps {
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ message = "Loading..." }) => {
  return (
    <div className="loader">
      <div className="loader-spinner" />
      <p>{message}</p>
    </div>
  );
};
