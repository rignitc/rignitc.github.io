// Load stack data and create mobile scrolling banner
fetch('/src/data/projects/stack.json')
    .then(response => response.json())
    .then(data => {
        const mobileScrollContainer = document.getElementById('mobile-stack-scroll');

        // Collect all stack items
        const allStackItems = [];
        Object.values(data.stack).forEach(category => {
            category.forEach(item => {
                allStackItems.push(item);
            });
        });

        // Create the scrolling content - DUPLICATE for seamless loop
        const createStackImages = () => {
            const fragment = document.createDocumentFragment();

            // Create TWO identical sets for seamless looping
            for (let i = 0; i < 2; i++) {
                allStackItems.forEach(item => {
                    const img = document.createElement('img');
                    img.src = item.src;
                    img.alt = item.alt;
                    fragment.appendChild(img);
                });
            }

            return fragment;
        };

        mobileScrollContainer.appendChild(createStackImages());
    })
    .catch(err => console.error("Error loading stack.json for mobile banner:", err));