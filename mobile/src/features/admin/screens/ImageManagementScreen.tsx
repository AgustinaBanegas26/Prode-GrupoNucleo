import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '../../../theme/theme';

type CarouselImage = {
  id: string;
  title: string;
  imageUrl: string;
  buttonText?: string;
  buttonLink?: string;
  order: number;
  active: boolean;
};

const MOCK_IMAGES: CarouselImage[] = [
  {
    id: '1',
    title: 'Promoción Especial',
    imageUrl: 'https://via.placeholder.com/400x200/CC2627/FFFFFF?text=Promocion',
    buttonText: 'Ver más',
    buttonLink: '/fixture',
    order: 1,
    active: true,
  },
  {
    id: '2',
    title: 'Jornada 10',
    imageUrl: 'https://via.placeholder.com/400x200/2196F3/FFFFFF?text=Jornada',
    buttonText: 'Ver resultados',
    buttonLink: '/results',
    order: 2,
    active: true,
  },
  {
    id: '3',
    title: 'Premios Disponibles',
    imageUrl: 'https://via.placeholder.com/400x200/FF9800/FFFFFF?text=Premios',
    buttonText: 'Reclamar',
    buttonLink: '/rewards',
    order: 3,
    active: false,
  },
];

export function ImageManagementScreen() {
  const { theme } = useAppTheme();
  const [images, setImages] = useState<CarouselImage[]>(MOCK_IMAGES);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    buttonText: '',
    buttonLink: '',
  });

  const handleAddImage = () => {
    if (!formData.title || !formData.imageUrl) {
      Alert.alert('Error', 'Por favor completa los campos obligatorios');
      return;
    }

    const newImage: CarouselImage = {
      id: Date.now().toString(),
      title: formData.title,
      imageUrl: formData.imageUrl,
      buttonText: formData.buttonText,
      buttonLink: formData.buttonLink,
      order: images.length + 1,
      active: true,
    };

    setImages([...images, newImage]);
    setFormData({ title: '', imageUrl: '', buttonText: '', buttonLink: '' });
    setShowForm(false);
    Alert.alert('Éxito', 'Imagen agregada correctamente');
  };

  const handleDeleteImage = (id: string) => {
    Alert.alert('Confirmar', '¿Deseas eliminar esta imagen?', [
      { text: 'Cancelar' },
      {
        text: 'Eliminar',
        onPress: () => {
          setImages(images.filter((img) => img.id !== id));
          Alert.alert('Éxito', 'Imagen eliminada');
        },
      },
    ]);
  };

  const handleToggleActive = (id: string) => {
    setImages(
      images.map((img) =>
        img.id === id ? { ...img, active: !img.active } : img,
      ),
    );
  };

  const renderImageItem = ({ item }: { item: CarouselImage }) => (
    <View
      style={[
        styles.imageCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: item.active ? theme.colors.primary : theme.colors.border,
          borderWidth: 2,
        },
      ]}
    >
      <View style={styles.imagePreview}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.previewImage}
          defaultSource={require('../../../assets/images/placeholder.png')}
        />
        <View
          style={[
            styles.imageMask,
            { opacity: item.active ? 0 : 0.5, backgroundColor: theme.colors.overlay },
          ]}
        />
        {!item.active && (
          <View style={styles.inactiveLabel}>
            <MaterialCommunityIcons name="eye-off" size={24} color="#fff" />
            <Text style={styles.inactiveLabelText}>Inactiva</Text>
          </View>
        )}
      </View>

      <View style={styles.imageInfo}>
        <View style={styles.infoHeader}>
          <View style={styles.titleSection}>
            <Text style={[styles.imageTitle, { color: theme.colors.text }]}>
              {item.title}
            </Text>
            <Text style={[styles.imageOrder, { color: theme.colors.textSecondary }]}>
              Orden: {item.order}
            </Text>
          </View>
          <Pressable
            onPress={() => handleToggleActive(item.id)}
            style={[
              styles.toggleButton,
              {
                backgroundColor: item.active ? theme.colors.success : theme.colors.warning,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={item.active ? 'eye' : 'eye-off'}
              size={16}
              color="#fff"
            />
          </Pressable>
        </View>

        {item.buttonText && (
          <View style={styles.buttonInfo}>
            <MaterialCommunityIcons
              name="button-pointer"
              size={14}
              color={theme.colors.primary}
            />
            <Text style={[styles.buttonLabel, { color: theme.colors.primary }]}>
              Botón: {item.buttonText} → {item.buttonLink}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            style={[
              styles.actionBtn,
              { backgroundColor: theme.colors.primaryLight },
            ]}
          >
            <MaterialCommunityIcons
              name="pencil"
              size={16}
              color={theme.colors.primary}
            />
            <Text style={[styles.actionBtnText, { color: theme.colors.primary }]}>
              Editar
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleDeleteImage(item.id)}
            style={[
              styles.actionBtn,
              { backgroundColor: theme.colors.surfaceAlt },
            ]}
          >
            <MaterialCommunityIcons
              name="delete"
              size={16}
              color={theme.colors.error}
            />
            <Text style={[styles.actionBtnText, { color: theme.colors.error }]}>
              Eliminar
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="image-multiple"
            size={32}
            color={theme.colors.primary}
          />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Gestión de Imágenes
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {images.length} imágenes en el slider
            </Text>
          </View>
        </View>

        {/* Add Button */}
        <Pressable
          onPress={() => setShowForm(!showForm)}
          style={[
            styles.addButton,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.addButtonText}>
            {showForm ? 'Cancelar' : 'Agregar Imagen'}
          </Text>
        </Pressable>

        {/* Form */}
        {showForm && (
          <View
            style={[
              styles.form,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.formLabel, { color: theme.colors.text }]}>
              Título *
            </Text>
            <TextInput
              placeholder="Ej: Jornada 10"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.title}
              onChangeText={(value) =>
                setFormData({ ...formData, title: value })
              }
              style={[
                styles.input,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  backgroundColor: theme.colors.background,
                },
              ]}
            />

            <Text style={[styles.formLabel, { color: theme.colors.text }]}>
              URL de Imagen *
            </Text>
            <TextInput
              placeholder="https://example.com/image.jpg"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.imageUrl}
              onChangeText={(value) =>
                setFormData({ ...formData, imageUrl: value })
              }
              style={[
                styles.input,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  backgroundColor: theme.colors.background,
                },
              ]}
            />

            <Text style={[styles.formLabel, { color: theme.colors.text }]}>
              Texto del Botón (Opcional)
            </Text>
            <TextInput
              placeholder="Ej: Ver más"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.buttonText}
              onChangeText={(value) =>
                setFormData({ ...formData, buttonText: value })
              }
              style={[
                styles.input,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  backgroundColor: theme.colors.background,
                },
              ]}
            />

            <Text style={[styles.formLabel, { color: theme.colors.text }]}>
              Link del Botón (Opcional)
            </Text>
            <TextInput
              placeholder="Ej: /fixture"
              placeholderTextColor={theme.colors.placeholder}
              value={formData.buttonLink}
              onChangeText={(value) =>
                setFormData({ ...formData, buttonLink: value })
              }
              style={[
                styles.input,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  backgroundColor: theme.colors.background,
                },
              ]}
            />

            <Pressable
              onPress={handleAddImage}
              style={[
                styles.submitButton,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={styles.submitButtonText}>Guardar Imagen</Text>
            </Pressable>
          </View>
        )}

        {/* Images List */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Imágenes Actuales
        </Text>

        <FlatList
          data={images}
          renderItem={renderImageItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.imagesList}
          gap={spacing.md}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: typography.bold as any,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: typography.regular as any,
    marginTop: spacing.xs,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: typography.semibold as any,
  },
  form: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: typography.semibold as any,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
  },
  submitButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: typography.semibold as any,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: typography.semibold as any,
    marginBottom: spacing.lg,
  },
  imagesList: {
    gap: spacing.md,
  },
  imageCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  imagePreview: {
    height: 180,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  inactiveLabel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  inactiveLabelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: typography.semibold as any,
  },
  imageInfo: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  titleSection: {
    flex: 1,
    gap: spacing.xs,
  },
  imageTitle: {
    fontSize: 14,
    fontWeight: typography.semibold as any,
  },
  imageOrder: {
    fontSize: 12,
    fontWeight: typography.regular as any,
  },
  toggleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  buttonLabel: {
    fontSize: 12,
    fontWeight: typography.regular as any,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: typography.semibold as any,
  },
});
