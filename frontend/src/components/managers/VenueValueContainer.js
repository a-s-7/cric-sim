import { useEffect, useRef } from "react";
import { components } from "react-select";

function VenueValueContainer(props) {
    const valueContainerRef = useRef(null);

    useEffect(() => {
        const valueContainer = valueContainerRef.current;
        if (valueContainer) valueContainer.scrollLeft = valueContainer.scrollWidth;
    }, [props.selectProps.value]);

    return (
        <components.ValueContainer
            {...props}
            innerProps={{ ...props.innerProps, ref: valueContainerRef }}
        />
    );
}

export default VenueValueContainer;
