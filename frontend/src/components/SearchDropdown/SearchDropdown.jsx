
// Componente de búsqueda dropdown


import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  TextInput,
  Paper,
  Loader,
  Center,
  ScrollArea,
  Stack,
  Text,
  Badge,
  ActionIcon,
  Group,
} from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import * as gameService from '../../services/api.service';
import classes from './SearchDropdown.module.css';

export function SearchDropdown({ onGameSelect, className, mobileMode = false, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [dropdownWidth, setDropdownWidth] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const searchRef = useRef(null);
  const timeoutRef = useRef(null);

  // Detecta si estamos en móvil/tablet
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Busca juegos conforme el usuario escribe
  useEffect(() => {
    // Limpia el timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Si no hay query, cierra el dropdown
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsOpen(false);
      return;
    }

    // Espera 300ms antes de hacer la búsqueda (debounce)
    setLoading(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await gameService.searchRAWGGames(searchQuery);
        const games = Array.isArray(response.data) ? response.data : response.data?.results || [];

        // Normaliza los datos
        const normalizedGames = games.slice(0, 8).map(game => ({
          ...game,
          title: game.name,
          coverImage: game.background_image,
        }));

        setSearchResults(normalizedGames);
        setIsOpen(true);
      } catch (error) {
        console.error('Error en búsqueda:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Calcula la posición y el ancho del dropdown
  const updateDropdownPosition = () => {
    if (searchRef.current) {
      const header = document.querySelector('header');
      if (header) {
        const headerRect = header.getBoundingClientRect();
        const searchRect = searchRef.current.getBoundingClientRect();
        
        // En modo móvil y pantalla estrecha, el dropdown ocupa todo el ancho del header
        if (mobileMode && window.innerWidth <= 768) {
          setDropdownPosition({
            top: headerRect.bottom + window.scrollY,
            left: headerRect.left + window.scrollX,
          });
          setDropdownWidth(headerRect.width);
        } else {
          // En otros casos, se alinea con la barra de búsqueda
          setDropdownPosition({
            top: headerRect.bottom + window.scrollY,
            left: searchRect.left + window.scrollX,
          });
          setDropdownWidth(searchRect.width);
        }
      }
    }
  };

  // Actualiza la posición cuando se abre el dropdown
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
    }
  }, [isOpen]);

  // Actualiza la posición cuando se hace scroll o cambia el tamaño de la ventana
  useEffect(() => {
    if (isOpen) {
      const handleScroll = () => updateDropdownPosition();
      const handleResize = () => updateDropdownPosition();

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize, true);

      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize, true);
      };
    }
  }, [isOpen]);



  // Cierra el dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Verifica si el clic fue fuera del contenedor de búsqueda y del dropdown
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        // Verifica si el clic fue en el dropdown (que está en el body)
        const dropdown = document.querySelector(`.${classes.dropdown}`);
        if (dropdown && !dropdown.contains(event.target)) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [classes.dropdown]);

  const handleGameClick = (game) => {
    console.log('Resultado seleccionado:', game);
    if (onGameSelect) {
      onGameSelect(game);
    }
    setSearchQuery('');
    setSearchResults([]);
    setIsOpen(false);
  };

  return (
    <>
      <div className={`${classes.container} ${mobileMode ? classes['mobile-mode'] : ''}`} ref={searchRef}>
        {mobileMode ? (
          <Group gap="xs" align="center" style={{ width: '100%', height: '100%', padding: 0 }}>
            <TextInput
              placeholder="Buscar juegos..."
              variant="filled"
              radius="xl"
              leftSection={<IconSearch size={16} />}
              className={classes.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              onFocus={() => searchQuery.trim() && setIsOpen(true)}
              styles={{
                input: {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff !important',
                  '&::placeholder': {
                    color: '#fff',
                  },
                  '&:focus': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                },
                root: {
                  flex: 1,
                  height: '100%',
                }
              }}
            />
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              radius="xl"
              onClick={onClose}
              style={{
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                flexShrink: 0,
              }}
            >
              <IconX size={20} />
            </ActionIcon>
          </Group>
        ) : (
          <TextInput
            placeholder=""
            variant="filled"
            radius="xl"
            leftSection={<IconSearch size={16} />}
            className={classes.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            onFocus={() => searchQuery.trim() && setIsOpen(true)}
            styles={{
              input: {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff !important',
                '&::placeholder': {
                  color: '#fff',
                },
                '&:focus': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
              },
            }}
          />
        )}
      </div>

      {isOpen && (!isMobile || mobileMode) && createPortal(
        <Paper
          className={classes.dropdown}
          shadow="lg"
          p="xs"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownWidth}px`,
            borderRadius: '0 0 20px 20px !important',
            overflow: 'hidden !important',
          }}
        >
          {loading ? (
            <Center py="xl">
              <Loader size="sm" color="pink" />
            </Center>
          ) : searchResults.length > 0 ? (
            <ScrollArea
              style={{
                height: 'auto',
                maxHeight: 400,
                overflow: 'auto'
              }}
              scrollbarSize={6}
            >
              <Stack gap="8px" p="8px">
                {searchResults.map((game) => (
                  <div
                    key={game.id}
                    className={classes.resultItem}
                    onClick={() => handleGameClick(game)}
                  >
                    {game.coverImage && (
                      <img
                        src={game.coverImage}
                        alt={game.title}
                        className={classes.resultImage}
                      />
                    )}
                    <div className={classes.resultContent}>
                      <div className={classes.resultTitle}>
                        {game.title}
                      </div>
                      {game.rating && (
                        <div className={classes.resultRating}>
                          ⭐ {game.rating.toFixed(1)}/5
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </Stack>
            </ScrollArea>
          ) : (
            <Center py="xl">
              <Text size="sm" c="dimmed">
                No se encontraron juegos
              </Text>
            </Center>
          )}
        </Paper>,
        document.body
      )}
    </>
  );
}
